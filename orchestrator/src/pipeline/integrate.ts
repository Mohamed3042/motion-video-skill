// Integration after all jobs are accepted (DETERMINISTIC except the director's final review):
// master music → onset check → tsc → final review → full render → ffprobe.
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {exec, node, studioBin, tail} from './exec.ts';
import {grid} from './plan.ts';
import {layout} from './scaffold.ts';
import {renderStills, typecheck} from './gates.ts';
import {review} from './review.ts';
import {finalReviewPrompt} from './prompts.ts';
import {deferred, type RunCtx} from './jobs.ts';

class StepError extends Error {}

export async function probe(file: string, fps: number, frames: number): Promise<{ok: boolean; details: string; data: unknown}> {
  const r = await exec('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,pix_fmt,r_frame_rate,nb_frames,width,height:format=duration,size', '-of', 'json', file], {cwd: path.dirname(file)});
  if (r.code !== 0) return {ok: false, details: `ffprobe failed: ${r.out}`, data: null};
  const j = JSON.parse(r.out) as {streams: Record<string, string | number>[]; format: {duration: string; size: string}};
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const problems: string[] = [];
  if (v?.codec_name !== 'h264') problems.push(`video codec ${v?.codec_name} (want h264)`);
  if (v?.pix_fmt !== 'yuv420p') problems.push(`pixel format ${v?.pix_fmt} (want yuv420p)`);
  if (v?.r_frame_rate !== `${fps}/1`) problems.push(`frame rate ${v?.r_frame_rate} (want ${fps}/1)`);
  if (Number(v?.nb_frames) !== frames) problems.push(`${v?.nb_frames} frames (want ${frames})`);
  if (a?.codec_name !== 'aac') problems.push(`audio codec ${a?.codec_name ?? 'none'} (want aac)`);
  const dur = Number(j.format.duration);
  if (!(Math.abs(dur - frames / fps) <= 2 / fps + 0.05)) problems.push(`duration ${dur} s (want ${frames / fps} s)`);
  const summary = `${v?.width}×${v?.height} ${v?.codec_name} ${v?.pix_fmt} ${v?.r_frame_rate} fps, ${v?.nb_frames} frames, ${a?.codec_name ?? 'no audio'}, ${dur.toFixed(3)} s, ${(Number(j.format.size) / 1e6).toFixed(2)} MB`;
  return {ok: problems.length === 0, details: problems.length ? `${summary}\nproblems: ${problems.join('; ')}` : summary, data: {video: v, audio: a, duration: dur}};
}

export async function integrate(ctx: RunCtx, outputsDir: string): Promise<string> {
  const {plan, studioRoot} = ctx;
  const L = layout(plan.slug);
  const g = grid(plan);
  const signal = ctx.abort.signal;
  const report: string[] = [];
  const step = async (name: string, fn: () => Promise<{ok: boolean; out: string}>) => {
    ctx.emit('log', `integrate: ${name}…`);
    const r = await fn();
    if (signal.aborted) throw new StepError('cancelled');
    ctx.emit('log', `integrate: ${name} ${r.ok ? 'ok' : 'FAILED'}`, {data: tail(r.out, 3000)});
    report.push(`## ${name}: ${r.ok ? 'ok' : 'FAILED'}\n${tail(r.out, 2500).trim()}`);
    if (!r.ok) throw new StepError(`integrate: ${name} failed:\n${tail(r.out, 4000)}`);
  };

  await step('master music', async () => {
    const r = await node(studioRoot, `${L.scripts}/music.ts`, [], {signal, timeoutMs: 30 * 60_000});
    return {ok: r.code === 0, out: r.out};
  });
  await step('onset check', async () => {
    const r = await node(studioRoot, `${L.scripts}/check.ts`, [], {signal, timeoutMs: 10 * 60_000});
    return {ok: r.code === 0, out: r.out};
  });
  await step('typecheck', async () => {
    const tc = await typecheck(studioRoot, signal);
    const mine = tc.errors.filter((e) => e.file.startsWith(`${L.src}/`) || e.file === 'src/Root.tsx');
    return {ok: mine.length === 0 && (tc.code === 0 || tc.errors.length > 0), out: mine.length ? mine.map((e) => e.raw).join('\n') : `no type errors in ${L.src}/ or src/Root.tsx`};
  });

  // ── final review (director): key frames of the whole reel ──
  const keys = [
    {f: Math.round(plan.intro.endFrame / 2), label: 'intro'},
    ...plan.segments.map((s) => ({f: s.startFrame + Math.round((s.endFrame - s.startFrame) / 2), label: `${s.id} (mid)`})),
    {f: Math.round((plan.outro.startFrame + g.duration) / 2), label: 'outro'},
  ];
  const st = await renderStills({studioRoot, slug: plan.slug, compId: L.reelId, props: null, frames: keys.map((k) => k.f), outDir: ctx.store.dir(ctx.run.id, 'stills', 'final'), signal});
  if (!st.ok) throw new StepError(`integrate: final stills failed:\n${st.details}`);
  const p = finalReviewPrompt(plan, keys.map((k) => `frame ${k.f} (${k.label})`), report.join('\n\n'));
  const out = await review({config: ctx.run.config, role: 'director', system: p.system, task: p.task, stills: st.files, minScore: ctx.run.config.gates.reviewMinScore, requireVision: false});
  if (out.usage) {
    ctx.ledger.add('director', out.usage);
    ctx.run.spentUSD = ctx.ledger.spentUSD;
  }
  ctx.emit('gate', `final review: ${out.skipped ? 'skipped' : out.gate.ok ? 'pass' : 'below threshold'}`, {data: out.gate});
  if (out.skipped || !out.gate.ok) {
    // a human (or the host director) decides: approve({what: 'final'}) renders anyway, cancel stops
    ctx.final = deferred<void>();
    ctx.run.error = `awaiting final approval: ${out.gate.details.split('\n')[0]}. Look at the final stills, then approve "final" to render (or cancel).`;
    ctx.emit('run', ctx.run.error, {data: {stills: st.files}});
    ctx.save();
    const onAbort = () => ctx.final?.reject(new StepError('cancelled'));
    signal.addEventListener('abort', onAbort, {once: true});
    await ctx.final.promise;
    signal.removeEventListener('abort', onAbort);
    ctx.final = null;
    ctx.run.error = undefined;
  }

  // ── render + verify ──
  ctx.run.status = 'rendering';
  ctx.save();
  ctx.emit('run', `rendering ${L.reelId} (${g.duration} frames)`);
  mkdirSync(outputsDir, {recursive: true});
  const file = path.join(outputsDir, `${plan.slug}.mp4`);
  const r = await studioBin(studioRoot, '@remotion/cli/remotion-cli.js', ['render', 'src/index.ts', L.reelId, file, '--overwrite'], {signal, timeoutMs: 6 * 3600_000});
  if (signal.aborted) throw new StepError('cancelled');
  if (r.code !== 0) throw new StepError(`render failed (exit ${r.code}):\n${tail(r.out, 5000)}`);
  const pr = await probe(file, plan.fps, g.duration);
  ctx.emit('log', `ffprobe: ${pr.details}`, {data: pr.data});
  if (!pr.ok) throw new StepError(`the rendered file does not match the plan: ${pr.details}`);
  return file;
}
