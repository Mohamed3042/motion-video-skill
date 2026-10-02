// The plan: the director's JSON output, validated by a schema + invariants before anything is generated from it.
import {z} from 'zod';
import type {Config, Format, Plan, Usage} from '../types.ts';
import {resolveRole} from '../config.ts';
import {makeProvider} from '../providers/index.ts';
import {makeTools} from '../agent/tools.ts';
import {runAgent} from '../agent/loop.ts';
import {directorPlanPrompt} from './prompts.ts';

export const FORMAT_SIZE: Record<Format, {width: number; height: number}> = {
  '16:9': {width: 1920, height: 1080},
  '9:16': {width: 1080, height: 1920},
  '1:1': {width: 1080, height: 1080},
};

// Frame grid derived from a plan (bpm → frames per beat / bar).
export const grid = (p: Pick<Plan, 'fps' | 'bpm' | 'seconds'>) => {
  const beat = (p.fps * 60) / p.bpm;
  return {beat, bar: beat * 4, duration: Math.round(p.seconds * p.fps), pad: Math.round(p.fps / 5)};
};

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex color like "#1ED760"');
const text = z.string().trim().min(1);

const SegmentSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]{1,15}$/, 'id must match /^[a-z][a-z0-9]{1,15}$/ (lowercase letters/digits, 2–16 chars, starts with a letter)'),
  name: text.max(40),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  accent: hex,
  brief: text,
  illusion: z.string().optional(),
  music: text,
  copy: z.array(text.max(80)).max(8),
  entrance: text,
  exit: text,
});

const PlanObject = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]{2,30}$/, 'slug must match /^[a-z][a-z0-9-]{2,30}$/'),
  title: text.max(80),
  seconds: z.number().positive().max(600),
  fps: z.union([z.literal(60), z.literal(30)]),
  format: z.enum(['16:9', '9:16', '1:1']),
  width: z.number().int().min(320).max(3840),
  height: z.number().int().min(320).max(3840),
  bpm: z.number().min(60).max(200),
  brand: z.object({
    name: text.max(40),
    colors: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'color names must be identifiers like "bg", "fg", "primary"'), hex),
    fonts: z.object({display: text, body: text.optional(), mono: text.optional()}),
    tagline: z.string().max(80).optional(),
    facts: z.array(text),
  }),
  intro: z.object({endFrame: z.number().int().positive(), brief: text, music: text}),
  outro: z.object({startFrame: z.number().int().positive(), brief: text, music: text}),
  segments: z.array(SegmentSchema).min(1).max(24),
  truthRules: z.array(text),
});

// On-screen words that make a product claim: allowed only when the line comes from brand.facts.
const CLAIMY = /\d|%|\$|€|£|#1|\b(best|fastest|first|only|leading|guarantee[ds]?|million|billion|thousand|users|customers|award|certified|available now|free|unlimited|instant)\b/i;
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}%$€£#]+/gu, ' ').trim();

export const PlanSchema = PlanObject.superRefine((p, ctx) => {
  const add = (pathParts: (string | number)[], message: string) => ctx.addIssue({code: 'custom', path: pathParts, message});
  const g = grid(p);
  const sec = (f: number) => `${f} (${(f / p.fps).toFixed(2)} s)`;

  if (!Number.isInteger(p.seconds * p.fps)) add(['seconds'], `seconds × fps must be a whole number of frames (got ${p.seconds} × ${p.fps})`);
  if (!Number.isInteger(g.beat))
    add(['bpm'], `bpm ${p.bpm} gives ${g.beat.toFixed(3)} frames per beat at ${p.fps} fps; pick a bpm where fps*60/bpm is a whole number (e.g. 120 → ${(p.fps * 60) / 120}, 100 → ${(p.fps * 60) / 100}, 150 → ${(p.fps * 60) / 150})`);
  const want = FORMAT_SIZE[p.format];
  if (Math.abs(p.width / p.height - want.width / want.height) > 0.01 || p.width % 2 || p.height % 2)
    add(['width'], `width×height ${p.width}×${p.height} must be even and match format ${p.format} (e.g. ${want.width}×${want.height})`);
  for (const k of ['bg', 'fg']) if (!p.brand.colors[k]) add(['brand', 'colors', k], `brand.colors must define "${k}" (background and main text color)`);
  if (!Number.isInteger(g.beat)) return; // the grid checks below need a whole beat

  const D = g.duration;
  const onBar = (f: number) => f % g.bar === 0;
  if (!onBar(p.intro.endFrame)) add(['intro', 'endFrame'], `intro.endFrame ${p.intro.endFrame} is not on the bar grid (bar = ${g.bar} frames at ${p.bpm} bpm, ${p.fps} fps)`);
  if (p.intro.endFrame < g.bar) add(['intro', 'endFrame'], `the intro must last at least one bar (${g.bar} frames)`);
  if (!onBar(p.outro.startFrame)) add(['outro', 'startFrame'], `outro.startFrame ${p.outro.startFrame} is not on the bar grid (multiples of ${g.bar})`);
  const outroLen = D - p.outro.startFrame;
  if (outroLen < 2 * p.fps || outroLen > 3 * p.fps)
    add(['outro', 'startFrame'], `the outro must last 2–3 s (${2 * p.fps}–${3 * p.fps} frames) but runs ${sec(p.outro.startFrame)} → ${sec(D)} = ${outroLen} frames`);

  const ids = new Set<string>();
  let cursor = p.intro.endFrame;
  p.segments.forEach((s, i) => {
    const at = ['segments', i];
    if (ids.has(s.id)) add([...at, 'id'], `duplicate segment id "${s.id}"`);
    if (s.id === 'intro' || s.id === 'outro') add([...at, 'id'], `"${s.id}" is reserved`);
    ids.add(s.id);
    if (s.startFrame !== cursor)
      add([...at, 'startFrame'], `segment "${s.id}" must start at frame ${cursor} (where the ${i ? `previous segment "${p.segments[i - 1].id}"` : 'intro'} ends), got ${s.startFrame}`);
    if (!onBar(s.startFrame)) add([...at, 'startFrame'], `segment "${s.id}" startFrame ${s.startFrame} is not on the bar grid (multiples of ${g.bar})`);
    if (!onBar(s.endFrame)) add([...at, 'endFrame'], `segment "${s.id}" endFrame ${s.endFrame} is not on the bar grid (multiples of ${g.bar})`);
    const len = s.endFrame - s.startFrame;
    if (len < 2 * p.fps || len > 10 * p.fps) add([...at, 'endFrame'], `segment "${s.id}" lasts ${len} frames (${(len / p.fps).toFixed(2)} s); segments must last 2–10 s`);
    s.copy.forEach((line, j) => {
      if (!CLAIMY.test(line)) return;
      const n = norm(line);
      const sourced = [...p.brand.facts, p.brand.name, p.brand.tagline ?? ''].some((f) => f && (norm(f).includes(n) || n.includes(norm(f))));
      if (!sourced) add([...at, 'copy', j], `copy line "${line}" looks like a product claim (numbers, prices or claim words) but is not in brand.facts; use only lines backed by brand.facts`);
    });
    cursor = s.endFrame;
  });
  if (cursor !== p.outro.startFrame) add(['outro', 'startFrame'], `outro.startFrame must equal the last segment's endFrame (${cursor}), got ${p.outro.startFrame}`);
});

export type PlanCheck = {ok: true; plan: Plan} | {ok: false; errors: string[]};

export function validatePlan(input: unknown): PlanCheck {
  const r = PlanSchema.safeParse(input);
  if (r.success) return {ok: true, plan: r.data as Plan};
  return {ok: false, errors: r.error.issues.map((i) => `${i.path.length ? i.path.join('.') : '(plan)'}: ${i.message}`)};
}

// Pull the first JSON object out of a model's reply (code fences, prose before/after, trailing commas).
export function extractJson(textIn: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(textIn);
  const candidates = [fenced?.[1], textIn].filter((x): x is string => !!x);
  for (const c of candidates) {
    const start = c.indexOf('{');
    if (start < 0) continue;
    // scan for the matching close brace, respecting strings
    let depth = 0;
    let inStr = false;
    for (let i = start; i < c.length; i++) {
      const ch = c[i];
      if (inStr) {
        if (ch === '\\') i++;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        const raw = c.slice(start, i + 1);
        try {
          return JSON.parse(raw);
        } catch {
          try {
            return JSON.parse(raw.replace(/,\s*([}\]])/g, '$1'));
          } catch {
            break;
          }
        }
      }
    }
  }
  throw new Error('no JSON object found in the reply');
}

export type PlanInput = {idea: string; seconds: number; format?: Format; brandNotes?: string};

// Run the director (API role) until it returns a valid plan; invalid plans go back with the errors (≤ 2 times).
export async function runDirector(o: {
  config: Config;
  studioRoot: string;
  input: PlanInput;
  onUsage?: (u: Usage) => void;
  onLog?: (line: string) => void;
  signal?: AbortSignal;
  budgetLeftUSD?: () => number;
}): Promise<Plan> {
  const r = resolveRole(o.config, 'director');
  if (r.kind === 'host') throw new Error('director is "host": pass the plan in');
  const provider = makeProvider(r.connection);
  const tools = makeTools({studioRoot: o.studioRoot, allow: [], commandAllow: [], vision: false});
  const {system, task} = directorPlanPrompt(o.input);
  let prompt = task;
  let lastErrors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await runAgent({provider, model: r.model, price: r.info?.price, system, task: prompt, tools, maxSteps: 12, signal: o.signal, budgetLeftUSD: o.budgetLeftUSD});
    o.onUsage?.(res.usage);
    if (res.stoppedBy === 'aborted' || res.stoppedBy === 'budget') throw new Error(`planning stopped: ${res.stoppedBy}`);
    let parsed: unknown;
    try {
      parsed = extractJson(res.finalText);
    } catch (e) {
      lastErrors = [(e as Error).message];
    }
    if (parsed !== undefined) {
      const v = validatePlan(parsed);
      if (v.ok) return v.plan;
      lastErrors = v.errors;
    }
    o.onLog?.(`plan attempt ${attempt + 1} rejected: ${lastErrors.slice(0, 5).join(' | ')}`);
    prompt = `${task}\n\n## Your previous plan was rejected\nFix every error below and return the complete corrected plan as ONE JSON object (no prose):\n${lastErrors.map((e) => `- ${e}`).join('\n')}\n\nPrevious reply:\n${res.finalText.slice(0, 12000)}`;
  }
  throw new Error(`the director did not produce a valid plan after 3 attempts:\n${lastErrors.join('\n')}`);
}
