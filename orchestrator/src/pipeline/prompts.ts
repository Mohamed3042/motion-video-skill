// Model-agnostic prompts: plain Markdown in, plain JSON (or tool calls) out. No vendor features.
import type {Format, GateResult, Plan, Segment} from '../types.ts';
import {FORMAT_SIZE, grid} from './plan.ts';
import {layout} from './scaffold.ts';

const list = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join('\n') : '- (none)');
const secs = (f: number, fps: number) => `${(f / fps).toFixed(2)} s`;

const TRUTH = [
  'Only show product capabilities listed in brand.facts (or stated by the user). Never invent features, stats, prices, user counts, testimonials or "available now".',
  'Sample UI content is clearly placeholder. Never use real people\'s names, faces or voices.',
];

// ── director: plan ────────────────────────────────────────────────────────────────────────────────
export function directorPlanPrompt(i: {idea: string; seconds: number; format?: Format; brandNotes?: string}): {system: string; task: string} {
  const format = i.format ?? '16:9';
  const size = FORMAT_SIZE[format];
  const tour = i.seconds >= 45;
  const system = `You are the director of a motion-graphics video made entirely in code (Remotion/React for every frame, a Node synthesizer for every sound). You write the plan: a JSON document that a team of builders turns into the video. The plan is data, never code. Reply with exactly ONE JSON object and nothing else.`;
  const task = `# Write the plan

## The request
- Idea: ${i.idea}
- Length: exactly ${i.seconds} s
- Format: ${format} (${size.width}×${size.height})
${i.brandNotes ? `- Brand notes (source of truth for brand and product facts):\n\n${i.brandNotes}\n` : ''}
## Output: ONE JSON object with exactly this shape
\`\`\`
{
  "slug": string,            // /^[a-z][a-z0-9-]{2,30}$/, e.g. "acme-tour" (becomes the folder and composition name)
  "title": string,
  "seconds": ${i.seconds},
  "fps": 60,                 // 60 unless told otherwise (30 allowed)
  "format": "${format}", "width": ${size.width}, "height": ${size.height},
  "bpm": number,             // fps*60/bpm MUST be a whole number of frames per beat (60 fps: 120 → 30, 100 → 36, 150 → 24, 90 → 40)
  "brand": {
    "name": string,
    "colors": {"bg": "#RRGGBB", "fg": "#RRGGBB", ...more named hex colors},   // "bg" and "fg" are required
    "fonts": {"display": "Google Fonts family", "body"?: "...", "mono"?: "..."},
    "tagline"?: string,
    "facts": string[]          // the ONLY product claims allowed on screen (from the brand notes / the user)
  },
  "intro": {"endFrame": number, "brief": string, "music": string},       // intro runs 0 → endFrame
  "outro": {"startFrame": number, "brief": string, "music": string},     // outro runs startFrame → seconds*fps
  "segments": [{
    "id": string,              // /^[a-z][a-z0-9]{1,15}$/, unique; not "intro"/"outro"
    "name": string,            // on-screen name (≤ 40 chars)
    "startFrame": number, "endFrame": number,   // global frames, bar-aligned
    "accent": "#RRGGBB",
    "brief": string,           // beat-by-beat picture spec with LOCAL frame numbers (0 = segment start)
    "illusion"?: string,       // optional optical illusion / signature visual idea
    "music": string,           // sound design: style, instruments, and every impact/hit with its local frame
    "copy": string[],          // the exact on-screen text allowed in this segment (≤ 8 short lines)
    "entrance": string,        // the motif it emerges from (= the previous segment's exit)
    "exit": string             // the motif it turns into (= the next segment's entrance)
  }],
  "truthRules": string[]       // what may and may never be shown
}
\`\`\`

## Timing rules (checked by a validator; a plan that breaks one is sent back)
- Total frames = seconds × fps. One beat = fps×60/bpm frames (whole number). One bar = 4 beats.
- Every boundary is on the bar grid: intro.endFrame, every segment's startFrame/endFrame and outro.startFrame are multiples of the bar.
- The intro lasts at least one bar. Segments are contiguous and non-overlapping: segment 1 starts at intro.endFrame, each next one starts where the previous ends, the last one ends at outro.startFrame.
- The outro (end card) lasts 2–3 s: seconds×fps − outro.startFrame is between 2×fps and 3×fps.
- Segment length: ${tour ? 'this is a feature tour, so give each feature its own world of 6–9 s' : 'this is a short promo, so use scenes of 2–3 s each (at least 3 scenes for ≤ 10 s if the bar grid allows)'}; hard limits 2–10 s.
- Worked example (60 fps, 120 bpm → beat 30, bar 120): 10 s = 600 frames → intro 0–120, segments 120–240, 240–360, 360–480, outro 480–600 (2 s).

## Brief rules
- Opening hook within the first second. End card (brand name, tagline) in the outro.
- Each segment: its own accent color and visual idea on the shared brand base; a beat-by-beat brief with local frame numbers; cuts are designed transitions (zoom-through, whip-pan, iris wipe, light flash, shape portal): each segment's exit motif becomes the next one's entrance.
- Music: one groove at the plan bpm across the whole video; each segment has its own sound palette; list every impact/hit on its frame (they will be checked to land within ±1 frame).
- Motion: animate transform and opacity; everything derives from the frame number (no randomness, no clocks).

## Truthfulness rules (mandatory)
${list(TRUTH)}
- Any on-screen line with numbers, prices or claim words (best, fastest, free, users, million, …) must come from brand.facts.
- Put these rules (plus any product-specific ones) into "truthRules".

Reply with the JSON object only.`;
  return {system, task};
}

// ── builders: shared system prompt ───────────────────────────────────────────────────────────────
export const BUILDER_SYSTEM = `You are a builder on a team making a motion-graphics video entirely in code: Remotion 4 + React 18 + TypeScript draw every frame, a Node script synthesizes every sound. You work through tools: read_file, list_files, write_file, edit_file, run_command (allow-listed commands only), view_image (if available) and finish. Paths are relative to the studio root. You may only write the files your job owns; everything else is read-only and changes there are reverted and fail the job. Read the contract files first, build, self-check with the allowed commands, then call finish with a short summary.`;

const RULES = (plan: Plan) => {
  const g = grid(plan);
  return [
    'Determinism: everything derives from the frame number. Never use Math.random, Date.now, new Date() or performance.now (an automatic gate rejects them). For randomness use `mulberry32(seed)` from the timing module.',
    `Plain timing modules (\`timing.ts\`) contain no JSX and no enums and import other .ts files with the \`.ts\` extension (or \`import type\`): the Node sound scripts import them too.`,
    `Grid: ${plan.fps} fps, ${plan.bpm} bpm → BEAT = ${g.beat} frames, BAR = ${g.bar} frames. Put hits on beats.`,
    'Animate transform and opacity; a few pre-blurred glow layers instead of many CSS blur() filters; ≤ 1,400 SVG elements.',
    `Canvas ${plan.width}×${plan.height}. Keep text and key UI inside the 72 px safe margin (use SAFE, W, H from brand.ts).${plan.format === '9:16' ? ' 9:16: keep text out of the top ~220 px and bottom ~380 px.' : ''}`,
    'Fonts: use FONT / BODY / MONO from brand.ts (already loaded via @remotion/google-fonts). Latin subsets lack glyphs like → ✓ ⇄: draw those as inline SVG.',
    'Only the exact copy lines listed for your part may appear on screen, spelled exactly.',
    'Every impact/hit EVENT needs a sound onset on exactly its frame: ≥ 6 dB jump over the 50 ms before it, within ±1 frame. A riser that runs straight into a hit fails: duck the bed ~60 ms before each impact ("suck-out").',
    'Sound level target: peaks around −6 dBFS, about −16 LUFS; the master mix matches parts to each other.',
  ];
};

const brandBlock = (plan: Plan) => `## Brand
- Name: ${plan.brand.name}${plan.brand.tagline ? ` · tagline: "${plan.brand.tagline}"` : ''}
- Colors (\`C\` in brand.ts): ${Object.entries(plan.brand.colors).map(([k, v]) => `${k} ${v}`).join(', ')}
- Fonts: display ${plan.brand.fonts.display}${plan.brand.fonts.body ? `, body ${plan.brand.fonts.body}` : ''}${plan.brand.fonts.mono ? `, mono ${plan.brand.fonts.mono}` : ''}
- Facts (the only product claims allowed): ${plan.brand.facts.length ? plan.brand.facts.map((f) => `"${f}"`).join('; ') : '(none: show no product claims)'}

## Truthfulness rules
${list([...TRUTH, ...plan.truthRules])}`;

export type JobSpec = {allow: string[]; commands: string[]; gates: string[]};

const jobFooter = (spec: JobSpec) => `## Files you own (the ONLY files you may create or edit)
${list(spec.allow.map((a) => `\`${a}\``))}

## Allowed commands (run_command, from the studio root, one at a time, no shell operators)
${list(spec.commands.map((c) => `\`${c}\``))}

## Gates (run automatically by the orchestrator after you call finish; self-check before)
${spec.gates.map((g, i) => `${i + 1}. ${g}`).join('\n')}

If a gate fails you get its exact output and another attempt; after repeated failures the job goes to a stronger model.

## When done
Call \`finish\` with a short summary (files written, events, anything the reviewer should know). Host workers: call submit_job instead.`;

// ── framework job ────────────────────────────────────────────────────────────────────────────────
export function frameworkJobPrompt(plan: Plan, spec: JobSpec): string {
  const L = layout(plan.slug);
  const g = grid(plan);
  const D = g.duration;
  return `# Job: the framework of "${plan.title}" (${plan.seconds} s)

You build everything around the segments: the intro (0 → ${plan.intro.endFrame}, ${secs(plan.intro.endFrame, plan.fps)}), the outro (${plan.outro.startFrame} → ${D}), the transitions between sections, global layers (camera shake, grain, vignette, HUD if wanted) and the master soundtrack. Other builders build the segments in parallel; never touch their folders.

## Plan
- ${plan.fps} fps, ${plan.width}×${plan.height}, ${D} frames, ${plan.bpm} bpm (BEAT ${g.beat}, BAR ${g.bar}), PAD ${g.pad} (each section's Sequence starts PAD frames early and ends PAD frames late: the transition overlap)
- Intro brief: ${plan.intro.brief}
- Intro music: ${plan.intro.music}
- Outro brief: ${plan.outro.brief}
- Outro music: ${plan.outro.music}
- Segments (exit → next entrance is your transition):
${plan.segments.map((s) => `  - ${s.id} "${s.name}" ${s.startFrame}–${s.endFrame}, accent ${s.accent}; entrance: ${s.entrance}; exit: ${s.exit}`).join('\n')}

${brandBlock(plan)}

## Read these contracts first (read-only)
- \`${L.src}/timing.ts\`: FPS, DURATION, BEAT, BAR, PAD, SEGMENTS, INTRO, OUTRO, SECTIONS, WorldEvent, mulberry32
- \`${L.src}/brand.ts\`, \`${L.src}/frame.ts\` (useSegFrame), \`${L.src}/util.ts\` (clamp, prog, ease, rgba)
- \`${L.src}/segments/index.ts\`: SEG_IMPL (each segment's World, EVENTS, HERO_FRAME)
- Your current files: \`${L.src}/Reel.tsx\`, \`${L.src}/shell/timing.ts\`, \`${L.src}/intro/Intro.tsx\`, \`${L.src}/outro/Outro.tsx\`, \`${L.scripts}/music.ts\`, \`${L.scripts}/check.ts\`, \`${L.scripts}/dsp.ts\`, \`${L.scripts}/types.ts\`

## Contract you must keep
- \`${L.src}/Reel.tsx\` exports \`Reel\` (the full video, ${D} frames) and keeps \`<Audio src={staticFile('${plan.slug}/music.wav')} />\`.
- \`${L.src}/shell/timing.ts\` exports \`FW_EVENTS\` (global frames; every impact/hit there gets a sound onset on its frame) and \`BOUNDARIES\`.
- \`${L.scripts}/music.ts\` writes \`public/${plan.slug}/music.wav\` (44.1 kHz 16-bit stereo, exactly ${plan.seconds} s), calls every segment's sound module with a SynthCtx, loudness-matches sections, masters to −14 LUFS integrated with true peak < −1 dBTP, and accepts \`--lenient\` (segment modules that throw are silenced and reported instead of failing: segments are still being built while you work).
- \`${L.scripts}/check.ts\` exits non-zero unless every impact/hit (FW_EVENTS + every segment's EVENTS) has an onset within ±1 frame.

## Build rules
${list(RULES(plan))}

${jobFooter(spec)}`;
}

// ── segment job ──────────────────────────────────────────────────────────────────────────────────
export function segmentJobPrompt(plan: Plan, seg: Segment, spec: JobSpec): string {
  const L = layout(plan.slug);
  const g = grid(plan);
  const i = plan.segments.findIndex((s) => s.id === seg.id);
  const prev = plan.segments[i - 1];
  const next = plan.segments[i + 1];
  const len = seg.endFrame - seg.startFrame;
  return `# Job: segment "${seg.id}" (${seg.name}) of "${plan.title}"

Build this segment's picture AND sound. Local frame 0 = the segment's first frame (global ${seg.startFrame}); it lasts ${len} frames (${secs(len, plan.fps)}). Your World is mounted from local −${g.pad} to ${len + g.pad} (PAD = ${g.pad} frames of transition overlap on each side), so make those edge frames look right too.

## Segment spec (from the approved plan)
- id: \`${seg.id}\` · name: "${seg.name}" · accent: ${seg.accent}
- global frames ${seg.startFrame} → ${seg.endFrame} · ${plan.fps} fps · ${plan.bpm} bpm (BEAT ${g.beat}, BAR ${g.bar} frames)
- Brief: ${seg.brief}
${seg.illusion ? `- Illusion / signature visual: ${seg.illusion}\n` : ''}- Music: ${seg.music}
- Copy (exact on-screen text allowed): ${seg.copy.length ? seg.copy.map((c) => `"${c}"`).join(' · ') : '(none: no on-screen text)'}
- Entrance: ${seg.entrance}${prev ? ` (previous segment "${prev.id}" exits with: ${prev.exit})` : ' (comes out of the intro)'}
- Exit: ${seg.exit}${next ? ` (next segment "${next.id}" enters with: ${next.entrance})` : ' (goes into the outro)'}

${brandBlock(plan)}

## Read these contracts first (read-only)
- \`${L.src}/timing.ts\`: FPS, BEAT, BAR, PAD, SEGMENTS, \`WorldEvent\` type, \`mulberry32\`
- \`${L.src}/frame.ts\`: \`useSegFrame()\` (local frame; 0 = segment start)
- \`${L.src}/brand.ts\`: \`C\` colors, \`ACCENT\`, \`FONT\`/\`BODY\`/\`MONO\`, \`W\`, \`H\`, \`SAFE\`
- \`${L.src}/util.ts\`: clamp, prog, lerp, smooth, ease, rgba, mixHex
- \`${L.scripts}/types.ts\`: the \`SynthCtx\` sound contract · \`${L.scripts}/dsp.ts\`: synth library (kick, clap, hat, sub, bell, pad, rhodesChord, boom, hit, thump, whoosh, riser, put, …)
- \`${L.scripts}/stage.ts\`: \`stage(ctx)\` → \`{bed, fx, s, finish}\`: write the groove into \`bed\`, event sounds into \`fx\` at \`s(localFrame)\`, then \`finish(impactAndHitFrames)\` ducks the bed before each impact and normalizes the level (about −16 LUFS, peaks ≤ −6 dBFS). Use it: it is how the sound gate is passed.
- Your placeholders (the sound placeholder shows the stage pattern): \`${L.src}/segments/${seg.id}/World.tsx\`, \`${L.src}/segments/${seg.id}/timing.ts\`, \`${L.scripts}/segments/${seg.id}.ts\`

## Contract you must keep
- \`${L.src}/segments/${seg.id}/World.tsx\` exports \`World: React.FC\` (no props) and draws with \`useSegFrame()\`.
- \`${L.src}/segments/${seg.id}/timing.ts\` exports \`EVENTS: WorldEvent[]\` (local frames; every sound-bearing moment; impact/hit may set \`shake\` 6–14) and \`HERO_FRAME\` (the most iconic local frame). Picture and sound both import it.
- \`${L.scripts}/segments/${seg.id}.ts\` default-exports \`render(ctx: SynthCtx)\` writing into ctx.L/R (dry) and ctx.sendL/R (reverb send), roughly within [ctx.at(−${g.pad}), ctx.at(ctx.length + ${g.pad})]; place each event with \`ctx.at(localFrame)\`.
- Assets (if any) go in \`public/${plan.slug}/${seg.id}/\` and load with \`staticFile('${plan.slug}/${seg.id}/…')\`.

## Build rules
${list(RULES(plan))}

${jobFooter(spec)}`;
}

// ── retry feedback ───────────────────────────────────────────────────────────────────────────────
export function feedbackSection(attempt: number, results: GateResult[], reviewMustFix: string[] = []): string {
  const failed = results.filter((r) => !r.ok);
  return `## Attempt ${attempt} was rejected: fix these and call finish again
Your files from that attempt are still in place; fix them (don't start over unless needed).
${failed.map((r) => `### Gate \`${r.gate}\` failed\n\`\`\`\n${r.details.slice(0, 6000)}\n\`\`\``).join('\n')}
${reviewMustFix.length ? `### Reviewer: must fix\n${list(reviewMustFix)}` : ''}`;
}

// ── reviewer ─────────────────────────────────────────────────────────────────────────────────────
export function reviewerPrompt(plan: Plan, what: {kind: 'framework' | 'segment'; seg?: Segment; frames: string[]}): {system: string; task: string} {
  const s = what.seg;
  return {
    system: 'You are a strict motion-design reviewer. You look at rendered stills of one part of a video and score them against a rubric. Reply with exactly ONE JSON object and nothing else.',
    task: `# Review: ${s ? `segment "${s.id}" (${s.name})` : 'the framework (intro, outro, transitions)'} of "${plan.title}"

The attached images are, in order: ${what.frames.join(', ')}.

## Spec
${s ? `- Brief: ${s.brief}\n- Accent: ${s.accent}\n- Allowed copy: ${s.copy.map((c) => `"${c}"`).join(' · ') || '(none)'}\n- Entrance: ${s.entrance} · Exit: ${s.exit}` : `- Intro: ${plan.intro.brief}\n- Outro: ${plan.outro.brief}`}
- Brand: ${plan.brand.name}; colors ${Object.entries(plan.brand.colors).map(([k, v]) => `${k} ${v}`).join(', ')}; display font ${plan.brand.fonts.display}
- Truth rules: ${plan.truthRules.join(' / ') || '(none)'}

## Rubric (score 0–10)
- 9–10: premium, on-brief, polished; nothing to fix.
- 7–8: good and on-brief; small polish issues only.
- 4–6: works but off-brief, generic, cluttered or hard to read.
- 0–3: broken, empty, placeholder-looking, illegible, or shows text/claims not allowed.
Check: matches the brief · brand colors and accent · on-screen text exactly from the allowed copy, spelled right, legible · nothing important inside the 72 px safe margin · no overlaps, clipped text or empty frames · visual quality.

## Reply with ONLY this JSON
{"score": <0-10>, "issues": ["<every issue you see>"], "mustFix": ["<issues that must be fixed before acceptance; empty if score ≥ 7>"]}`,
  };
}

// ── director: final review ───────────────────────────────────────────────────────────────────────
export function finalReviewPrompt(plan: Plan, frames: string[], report: string): {system: string; task: string} {
  return {
    system: 'You are the director doing the final review of a finished motion-graphics video before the full render. Reply with exactly ONE JSON object and nothing else.',
    task: `# Final review: "${plan.title}" (${plan.seconds} s, ${plan.width}×${plan.height}, ${plan.fps} fps)

${frames.length ? `The attached stills are, in order: ${frames.join(', ')}.` : 'No stills are attached (your model cannot view images): judge from the report.'}

## Plan
- Intro: ${plan.intro.brief}
${plan.segments.map((s) => `- ${s.startFrame}–${s.endFrame} ${s.id} "${s.name}": ${s.brief}`).join('\n')}
- Outro: ${plan.outro.brief}
- Truth rules: ${plan.truthRules.join(' / ') || '(none)'}

## Integration report (deterministic checks already passed)
\`\`\`
${report.slice(0, 8000)}
\`\`\`

## Rubric (score 0–10)
Does it deliver the brief as one continuous, premium piece: consistent brand, readable copy, designed transitions, nothing empty or broken, no claims outside the brand facts?

## Reply with ONLY this JSON
{"score": <0-10>, "issues": ["..."], "mustFix": ["..."]}`,
  };
}
