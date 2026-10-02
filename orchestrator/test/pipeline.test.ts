// Pipeline proof: `node test/pipeline.test.ts`
// 1. units: plan validation (bad plans rejected with readable errors), JSON extraction, ownership + determinism
//    gates on a temp folder, Root.tsx marker registration (idempotent, reversible).
// 2. end to end on the REAL studio: mock API providers (director, reviewer, escalation) over HTTP + a fake host
//    builder (plain code) → REAL scaffold, REAL gates (a Math.random fails on purpose → retry → escalation),
//    REAL review loop, REAL integrate and a REAL MP4 render, verified with ffprobe. Cleans up everything after.
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defaultConfig, saveConfig} from '../src/config.ts';
import type {Job, Plan, Run} from '../src/types.ts';
import {extractJson, validatePlan} from '../src/pipeline/plan.ts';
import {determinismGate, ownershipGate, snapshot} from '../src/pipeline/gates.ts';
import {registerInRoot, removeScaffold} from '../src/pipeline/scaffold.ts';
import {createOrchestrator, waitForRun} from '../src/pipeline/orchestrator.ts';
import {probe} from '../src/pipeline/integrate.ts';
import {exec} from '../src/pipeline/exec.ts';
import {startMock, type MockRequest} from './helpers/mock-api.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const STUDIO = path.join(REPO, 'studio');
const PLAN: Plan = JSON.parse(readFileSync(path.join(HERE, 'fixtures/plan-tiny.json'), 'utf8'));
const clone = <T>(x: T): T => structuredClone(x);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const ok = (name: string) => {
  passed++;
  console.log(`  ok  ${name}`);
};

// ── 1. units ─────────────────────────────────────────────────────────────────────────────────────
console.log('plan validation');
{
  const v = validatePlan(PLAN);
  assert.ok(v.ok, v.ok ? '' : v.errors.join('\n'));
  ok('the fixture plan is valid');

  const bad = (mutate: (p: Plan) => void, expect: RegExp, name: string) => {
    const p = clone(PLAN);
    mutate(p);
    const r = validatePlan(p);
    assert.ok(!r.ok, `${name}: should be rejected`);
    assert.ok(r.errors.some((e) => expect.test(e)), `${name}: no error matches ${expect}\n${r.errors.join('\n')}`);
    ok(`rejects ${name}: "${r.errors.find((e) => expect.test(e))}"`);
  };
  bad((p) => (p.segments[1].startFrame = 250), /segments\.1\.startFrame: segment "offline" must start at frame 240/, 'a gap between segments');
  bad((p) => ((p.segments[0].endFrame = 250), (p.segments[1].startFrame = 250)), /not on the bar grid \(multiples of 120\)/, 'frames off the bar grid');
  bad((p) => (p.bpm = 140), /bpm 140 gives 25\.714 frames per beat/, 'a bpm without whole-frame beats');
  bad((p) => (p.segments[1].id = 'sync'), /duplicate segment id "sync"/, 'duplicate ids');
  bad((p) => (p.segments[0].id = 'Sync!'), /segments\.0\.id: id must match/, 'a bad id');
  bad((p) => (p.segments[0].accent = 'blue'), /segments\.0\.accent: must be a hex color/, 'a non-hex color');
  bad((p) => (p.segments[0].copy = ['Trusted by 2 million users']), /looks like a product claim .* not in brand\.facts/, 'a claim not in brand.facts');
  bad((p) => ((p.outro.startFrame = 240), (p.segments = p.segments.slice(0, 1))), /the outro must last 2–3 s/, 'an outro that is too long');
  bad((p) => (p.width = 1000), /must be even and match format 16:9/, 'a size that does not match the format');
  bad((p) => delete (p.brand.colors as Record<string, string>).bg, /brand\.colors must define "bg"/, 'missing bg color');
  const fenced = extractJson('Sure! Here is the plan:\n```json\n{"a": {"b": [1, 2,]}, "s": "} tricky {"}\n```\nThanks');
  assert.deepEqual(fenced, {a: {b: [1, 2]}, s: '} tricky {'});
  ok('extracts JSON from prose + code fence (trailing commas, braces in strings)');
}

console.log('ownership + determinism gates (temp folder)');
{
  const dir = mkdtempSync(path.join(tmpdir(), 'mvo-own-'));
  const w = (rel: string, text: string) => {
    mkdirSync(path.dirname(path.join(dir, rel)), {recursive: true});
    writeFileSync(path.join(dir, rel), text);
  };
  w('src/v/timing.ts', 'export const A = 1;\n');
  w('src/v/segments/a/World.tsx', 'export const World = () => null;\n');
  w('src/Root.tsx', 'root\n');
  const base = snapshot(dir);
  w('src/v/segments/a/World.tsx', 'export const World = () => null; // edited\nconst x = Math.random();\n// Math.random in a comment is fine\n');
  w('src/v/segments/a/new.ts', 'export const B = 2;\n');
  w('src/v/timing.ts', 'export const A = 2; // tampered\n');
  w('src/v/segments/b/World.tsx', "export const World = () => 'b';\n"); // another job's file (concurrent)
  w('src/stray.ts', 'oops\n');
  const allow = ['src/v/segments/a/**'];
  const others = [{jobId: 'b', allow: ['src/v/segments/b/**'], segId: 'b'}];
  const dry = ownershipGate({studioRoot: dir, base, allow, others, dryRun: true});
  assert.equal(dry.ok, false);
  assert.match(readFileSync(path.join(dir, 'src/v/timing.ts'), 'utf8'), /tampered/, 'dry run must not revert');
  const g = ownershipGate({studioRoot: dir, base, allow, others});
  assert.equal(g.ok, false);
  assert.match(g.details, /src\/v\/timing\.ts \(modified, reverted\)/);
  assert.match(g.details, /src\/stray\.ts \(created, reverted\)/);
  assert.doesNotMatch(g.details, /segments\/b/, "another job's file must not count against this job");
  assert.equal(readFileSync(path.join(dir, 'src/v/timing.ts'), 'utf8'), 'export const A = 1;\n', 'out-of-scope edit reverted');
  assert.ok(!existsSync(path.join(dir, 'src/stray.ts')), 'out-of-scope new file deleted');
  assert.ok(existsSync(path.join(dir, 'src/v/segments/b/World.tsx')), "other job's file kept");
  assert.deepEqual(g.changed, ['src/v/segments/a/World.tsx', 'src/v/segments/a/new.ts']);
  ok(`ownership: out-of-scope changes reverted, own + concurrent jobs' files kept\n${g.details.replace(/^/gm, '        ')}`);
  const again = ownershipGate({studioRoot: dir, base, allow, others});
  assert.ok(again.ok, again.details);
  ok('ownership: passes once only owned files changed');
  const d = determinismGate({studioRoot: dir, allow});
  assert.equal(d.ok, false);
  assert.match(d.details, /src\/v\/segments\/a\/World\.tsx:2: Math\.random/);
  assert.doesNotMatch(d.details, /:3:/, 'comments are ignored');
  ok(`determinism: ${d.details.split('\n')[1]}`);
  rmSync(dir, {recursive: true, force: true});
}

console.log('Root.tsx marker registration');
{
  const dir = mkdtempSync(path.join(tmpdir(), 'mvo-root-'));
  mkdirSync(path.join(dir, 'src'));
  const original = readFileSync(path.join(STUDIO, 'src/Root.tsx'), 'utf8');
  writeFileSync(path.join(dir, 'src/Root.tsx'), original);
  registerInRoot(dir, 'my-promo');
  registerInRoot(dir, 'my-promo');
  const t = readFileSync(path.join(dir, 'src/Root.tsx'), 'utf8');
  assert.equal(t.split('mvo:my-promo').length - 1, 2, 'exactly one import + one composition line');
  assert.match(t, /<mvo:imports>.*\r?\nimport \{Compositions as MyPromoCompositions\} from '\.\/my-promo\/Root'; \/\/ mvo:my-promo/);
  assert.match(t, /<mvo:compositions>.*\r?\n\s+<MyPromoCompositions \/>\{\/\* mvo:my-promo \*\/\}/);
  registerInRoot(dir, 'my-promo', false);
  assert.equal(readFileSync(path.join(dir, 'src/Root.tsx'), 'utf8'), original);
  ok('register is idempotent and unregister restores the file byte for byte');
  rmSync(dir, {recursive: true, force: true});
}

// ── 2. end to end ────────────────────────────────────────────────────────────────────────────────
console.log('end to end (real studio, mock providers, fake host builder)');

const reply = (message: unknown, prompt = 1200, completion = 300) => ({body: {choices: [{message}], usage: {prompt_tokens: prompt, completion_tokens: completion}}});
const textOf = (req: MockRequest) =>
  (req.body?.messages ?? [])
    .map((m: {content: unknown}) => (typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map((p: {text?: string}) => p.text ?? '').join('') : ''))
    .join('\n');
const imagesOf = (req: MockRequest) => (req.body?.messages ?? []).flatMap((m: {content: unknown}) => (Array.isArray(m.content) ? m.content.filter((p: {type: string}) => p.type === 'image_url') : [])).length;

// director: first an invalid plan (gap), then the valid one once the errors come back; final review → 9
const director = await startMock((req) => {
  const t = textOf(req);
  if (/Final review/.test(t)) return reply({role: 'assistant', content: '{"score": 9, "issues": ["mock: looks fine"], "mustFix": []}'});
  const p = clone(PLAN);
  if (!/was rejected/.test(t)) p.segments[1].startFrame = 250;
  return reply({role: 'assistant', content: `Here is the plan:\n\`\`\`json\n${JSON.stringify(p, null, 2)}\n\`\`\``}, 3000, 1500);
});
// reviewer: the first look at segment "sync" fails with a must-fix (exercises the review → retry loop), then passes
let syncReviews = 0;
const reviewer = await startMock((req) => {
  const t = textOf(req);
  if (/segment "sync"/.test(t) && syncReviews++ === 0) return reply({role: 'assistant', content: '{"score": 5, "issues": ["the card is small"], "mustFix": ["make the card larger"]}'});
  return reply({role: 'assistant', content: '{"score": 8, "issues": [], "mustFix": []}'});
});

// fake builder output (plain code, no LLM)
const SLUG = PLAN.slug;
const S = `src/${SLUG}`;
const SC = `scripts/${SLUG}`;
const worldTsx = (id: string, text: string, random: boolean) => `import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, H, W} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp, ease, rgba} from '../../util';
import {HERO_FRAME} from './timing';

export const World: React.FC = () => {
  const f = useSegFrame();
  const p = ease.backOut(clamp(f / 24));
  const x = (clamp((f - 30) / (HERO_FRAME - 30)) - 0.5) * W * 0.4${random ? ' + Math.random() * 4' : ''};
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{background: \`radial-gradient(circle at 50% 45%, \${rgba(ACCENT.${id}, 0.35)}, transparent 60%)\`}} />
      <div style={{position: 'absolute', left: W / 2 - 160 + x, top: H * 0.3, width: 320, height: 200, borderRadius: 24, background: ACCENT.${id}, transform: \`scale(\${p})\`}} />
      <div style={{position: 'absolute', width: '100%', top: H * 0.72, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.fg, opacity: p}}>${text}</div>
    </AbsoluteFill>
  );
};
`;
const timingTs = (kind: 'hit' | 'impact', f: number) => `import type {WorldEvent} from '../../timing';

export const EVENTS: WorldEvent[] = [{f: ${f}, kind: '${kind}', shake: 8}];
export const HERO_FRAME = ${f};
`;
const soundTs = (id: string) => `import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT, FPS} from '../../../src/${SLUG}/timing.ts';
import {EVENTS} from '../../../src/${SLUG}/segments/${id}/timing.ts';

export default function render(ctx: SynthCtx) {
  const {bed, fx, s, finish} = stage(ctx);
  for (let f = 0; f < ctx.length; f += BEAT) D.kick(bed, s(f), 0.5);
  D.pad(bed, s(0), [57, 60, 64, 69], ctx.length / FPS, 0.12, {lp0: 600, lp1: 2200, att: 0.2, rel: 0.2, send: 0.4});
  for (const e of EVENTS) {
    D.hit(fx, s(e.f), 0.7);
    D.boom(fx, s(e.f), 0.4, 1.2);
  }
  finish(EVENTS.map((e) => e.f));
}
`;
const files = (id: string, text: string, kind: 'hit' | 'impact', f: number, random: boolean): Record<string, string> => ({
  [`${S}/segments/${id}/World.tsx`]: worldTsx(id, text, random),
  [`${S}/segments/${id}/timing.ts`]: timingTs(kind, f),
  [`${SC}/segments/${id}.ts`]: soundTs(id),
});

// escalation (API): writes a clean "offline" through the real tool loop (write_file ×3, then finish)
const escalation = await startMock((req) => {
  const t = textOf(req);
  if (/wrote .*offline/.test(t) && req.body.messages.at(-1)?.role === 'tool') return reply({role: 'assistant', content: 'done'});
  const id = /# Job: segment "(\w+)"/.exec(t)?.[1] ?? 'offline';
  const calls = Object.entries(files(id, 'Works offline', 'impact', 30, false)).map(([p, content], i) => ({id: `w${i}`, type: 'function', function: {name: 'write_file', arguments: JSON.stringify({path: p, content})}}));
  calls.push({id: 'fin', type: 'function', function: {name: 'finish', arguments: JSON.stringify({summary: `rebuilt ${id} without Math.random`})}});
  return reply({role: 'assistant', content: null, tool_calls: calls}, 9000, 2500);
});

const tmp = mkdtempSync(path.join(tmpdir(), 'mvo-e2e-'));
const configPath = path.join(tmp, 'motion.config.json');
const cfg = defaultConfig();
cfg.studio = STUDIO;
cfg.budgetUSD = 1;
cfg.gates = {retries: 1, reviewMinScore: 7, parallel: 2};
const price = {inPerM: 0.2, outPerM: 0.8};
for (const [id, m] of [
  ['mockdir', director],
  ['mockrev', reviewer],
  ['mockesc', escalation],
] as const) {
  cfg.connections[id] = {id, kind: 'openai', baseUrl: m.url};
  cfg.models[`${id}/model`] = {ref: `${id}/model`, price, vision: true};
}
cfg.roles = {director: 'mockdir/model', builder: 'host', reviewer: 'mockrev/model', escalation: 'mockesc/model'};
await saveConfig(cfg, configPath);

removeScaffold(STUDIO, PLAN.slug); // leftovers of an interrupted earlier run
const rootBefore = readFileSync(path.join(STUDIO, 'src/Root.tsx'), 'utf8');
const orch = await createOrchestrator({configPath});
let run: Run | undefined;
let run2: Run | undefined;
const t0 = Date.now();
const since = () => `${((Date.now() - t0) / 1000).toFixed(0)} s`;
try {
  run = await orch.plan({idea: 'A tiny promo for a notes app', seconds: 8, format: '16:9'});
  assert.equal(run.status, 'awaiting-approval');
  assert.equal(director.requests.length, 2, 'the invalid plan went back once');
  assert.match(textOf(director.requests[1]), /segments\.1\.startFrame: segment "offline" must start at frame 240/);
  assert.ok(run.estimate && run.estimate.roles.length === 4);
  ok(`plan: invalid first plan sent back with its errors, valid on the 2nd try; estimate $${run.estimate.totalUSD}, ${run.jobs.length} jobs`);

  const events: string[] = [];
  orch.subscribe(run.id, (e) => {
    if (e.type !== 'log') events.push(`${e.type}: ${e.message}`);
    if (e.type === 'run' || e.type === 'gate') console.log(`      [${since()}] ${e.type}: ${e.message.split('\n')[0].slice(0, 140)}`);
  });
  await orch.start(run.id);

  // the host builder: claim → write files → submit, until no job waits for a host
  const subs: {job: string; attempt: number; status: string; failed: string}[] = [];
  for (;;) {
    const st = await orch.status(run.id);
    if (!['scaffolding', 'building'].includes(st.status)) break;
    const job = await orch.claimJob({runId: run.id, worker: 'fake-host'});
    if (!job) {
      await sleep(250);
      continue;
    }
    let write: Record<string, string>;
    if (job.kind === 'framework') write = {[`${S}/intro/Intro.tsx`]: readFileSync(path.join(STUDIO, `${S}/intro/Intro.tsx`), 'utf8').replace('scale(${0.92 + 0.08 * p})', 'scale(${0.9 + 0.1 * p})')};
    else if (job.segmentId === 'sync') write = files('sync', 'Notes sync across your devices', 'hit', 60, false);
    else write = files('offline', 'Works offline', 'impact', 30, true); // Math.random on purpose → determinism fails
    for (const [rel, text] of Object.entries(write)) writeFileSync(path.join(STUDIO, rel), text);
    const after: Job = await orch.submitJob({jobId: job.id, note: 'fake builder'});
    const failed = after.gates.filter((g) => !g.ok).map((g) => g.gate).join(',') || '-';
    subs.push({job: job.id.replace(`${run.id}-`, ''), attempt: after.attempt, status: after.status, failed});
    console.log(`      [${since()}] submitted ${job.id.replace(`${run.id}-`, '')} attempt ${after.attempt} → ${after.status} (failed gates: ${failed})`);
  }
  const final = await waitForRun(orch, run.id);
  assert.equal(final.status, 'done', `run ended ${final.status}: ${final.error ?? ''}`);
  const job = (k: string) => final.jobs.find((j) => j.id === `${run!.id}-${k}`)!;
  const fw = job('fw');
  const sync = job('s-sync');
  const off = job('s-offline');
  assert.equal(fw.status, 'accepted');
  assert.equal(fw.attempt, 1);
  ok(`framework accepted on attempt 1 (${fw.gates.map((g) => `${g.gate} ${g.ok ? '✓' : '✗'}`).join(', ')})`);
  assert.equal(sync.status, 'accepted');
  assert.equal(sync.attempt, 2);
  assert.ok(subs.some((s) => s.job === 's-sync' && s.attempt === 1 && s.failed === 'review'), 'sync attempt 1 failed review');
  assert.match(sync.gates.find((g) => g.gate === 'sound')!.details, /LUFS, peak -?[\d.]+ dBFS, 1 impact\/hit onset\(s\) on their frames/);
  ok('sync: review score 5 with a must-fix sent it back (counted as a retry), accepted on attempt 2');
  assert.equal(off.status, 'accepted');
  assert.equal(off.role, 'escalation');
  assert.equal(off.attempt, 3);
  assert.deepEqual(
    subs.filter((s) => s.job === 's-offline').map((s) => s.failed),
    ['determinism', 'determinism'],
  );
  assert.ok(off.log.some((l) => /escalated to mockesc\/model/.test(l)));
  assert.ok(off.usage.costUSD > 0);
  assert.ok(textOf(escalation.requests[0]).includes('previous builder failed this job 2 time(s)'));
  ok(`offline: Math.random failed determinism twice (builder + retry with the gate output), escalated, rebuilt by the escalation model through the real tool loop, accepted on attempt 3`);
  assert.ok(reviewer.requests.every((r) => imagesOf(r) === 3), 'the reviewer saw 3 stills per job');
  assert.ok(imagesOf(director.requests.at(-1)!) === PLAN.segments.length + 2, 'the director saw the final key frames');
  ok(`reviews: ${reviewer.requests.length} job reviews with 3 stills each, final review with ${PLAN.segments.length + 2} key frames`);
  assert.ok(final.spentUSD > 0 && final.spentUSD < cfg.budgetUSD);
  ok(`budget: $${final.spentUSD.toFixed(4)} spent of $${cfg.budgetUSD} (ledger from API usage)`);

  const log = await exec('git', ['log', '--format=%s', `HEAD..${final.branch}`], {cwd: REPO});
  const commits = log.out.trim().split(/\r?\n/);
  assert.equal(commits.length, 4, log.out);
  assert.ok(commits.some((c) => /scaffold from plan/.test(c)) && commits.filter((c) => /accept/.test(c)).length === 3);
  const head = await exec('git', ['symbolic-ref', '--short', 'HEAD'], {cwd: REPO});
  ok(`git: ${commits.length} commits on ${final.branch} (scaffold + 3 accepted jobs); checkout still on ${head.out.trim()}`);

  assert.ok(final.output && existsSync(final.output));
  const pr = await probe(final.output, PLAN.fps, PLAN.seconds * PLAN.fps);
  assert.ok(pr.ok, pr.details);
  ok(`render: ${path.relative(REPO, final.output)} → ffprobe ${pr.details}`);
  assert.ok(events.some((e) => /^run: done/.test(e)));
  console.log(`  e2e took ${since()}`);

  // the rest of the facade on the finished run
  assert.ok((await orch.listRuns()).some((r) => r.id === run!.id && r.status === 'done' && r.output === final.output));
  assert.equal((await orch.estimate(run.id)).roles.length, 4);
  assert.equal((await orch.getConfig()).roles.builder, 'host');
  assert.deepEqual(await orch.listModels('mockdir'), []);
  assert.equal((await orch.stills(sync.id)).length, 3);
  const dry = await orch.runGates(sync.id);
  assert.deepEqual(
    dry.map((g) => `${g.gate}:${g.ok}`),
    ['ownership:true', 'typecheck:true', 'determinism:true', 'stills:true', 'sound:true'],
  );
  ok(`facade: listRuns, estimate, getConfig, listModels, stills, runGates (dry run: ${dry.map((g) => g.gate).join(', ')} all pass on the accepted segment)`);

  // ── budget pause → raise → approve → resume → cancel, with a plan passed in by a host director ──
  console.log('  budget pause / resume / cancel (host-provided plan, API builder)');
  const badPlan = clone(PLAN);
  badPlan.segments[0].accent = 'red';
  await assert.rejects(orch.plan({idea: 'x', seconds: 8, plan: badPlan}), /invalid plan:\n- segments\.0\.accent: must be a hex color/);
  const directorCalls = director.requests.length;
  run2 = await orch.plan({idea: 'budget test', seconds: 8, plan: PLAN});
  assert.equal(run2.status, 'awaiting-approval');
  assert.equal(director.requests.length, directorCalls, 'a host plan costs no director call');
  await orch.setRoles({runId: run2.id, roles: {builder: 'mockesc/model'}, budgetUSD: 0.002});
  await assert.rejects(orch.start(run2.id), /exceeds the budget/);
  await orch.approve({runId: run2.id, what: 'budget'}); // start anyway; the run still pauses at the cap
  for (let i = 0; i < 600 && (await orch.status(run2.id)).status !== 'paused-budget'; i++) await sleep(250);
  const paused = await orch.status(run2.id);
  assert.equal(paused.status, 'paused-budget', `run2 is ${paused.status}: ${paused.error ?? ''}`);
  assert.ok(paused.spentUSD >= 0.002);
  await assert.rejects(orch.approve({runId: run2.id, what: 'budget'}), /raise budgetUSD first/);
  await orch.setRoles({runId: run2.id, budgetUSD: 5});
  assert.equal((await orch.approve({runId: run2.id, what: 'budget'})).status, 'building');
  ok(`budget: paused at $${paused.spentUSD.toFixed(4)} of $0.002, approve refused until the cap was raised, then resumed`);
  const cancelled = await orch.cancel(run2.id);
  assert.equal(cancelled.status, 'cancelled');
  assert.ok(cancelled.jobs.every((j) => ['accepted', 'cancelled'].includes(j.status)), cancelled.jobs.map((j) => j.status).join(','));
  ok(`cancel: run stopped, jobs ${cancelled.jobs.map((j) => j.status).join('/')}`);
} finally {
  // leave the repo exactly as it was
  for (const r of [run, run2]) {
    if (!r) continue;
    const st = await orch.status(r.id).catch(() => null);
    if (st && ['scaffolding', 'building', 'integrating', 'rendering', 'paused-budget'].includes(st.status)) await orch.cancel(r.id);
    if (st?.branch) await exec('git', ['branch', '-D', st.branch], {cwd: REPO});
    if (st?.output) rmSync(st.output, {force: true});
    rmSync(path.join(REPO, '.motion/runs', r.id), {recursive: true, force: true});
  }
  removeScaffold(STUDIO, SLUG);
  assert.equal(readFileSync(path.join(STUDIO, 'src/Root.tsx'), 'utf8'), rootBefore, 'Root.tsx restored');
  await Promise.all([director.close(), reviewer.close(), escalation.close()]);
  rmSync(tmp, {recursive: true, force: true});
}
const status = await exec('git', ['status', '--porcelain', '--', 'studio', 'outputs'], {cwd: REPO});
assert.ok(!status.out.includes(SLUG), `generated files left behind:\n${status.out}`);
ok('cleanup: generated studio files, branch, MP4 and run folder removed; Root.tsx restored');
console.log(`\n${passed} checks passed`);
