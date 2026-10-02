// Contract between the master music script and each section's sound module (scripts/orbit/sections/<id>.ts).
// A section module default-exports `render(ctx)` and writes its sound into ctx.L/R (dry) and ctx.sendL/R (reverb send).
// Write roughly within [at(-15), at(length + 15)]; quiet tails may run up to ~0.5 s past the section end.
// Level target inside the section: peaks around -6 dBFS, about -16 LUFS. The master matches sections to each other.
// Every impact/hit EVENT needs a clean transient: cut/duck the bed ~60 ms before it (onset check: ≥6 dB jump, ±1 frame).

export type SynthCtx = {
  SR: number; // 44100
  L: Float64Array; // dry bus, whole track
  R: Float64Array;
  sendL: Float64Array; // reverb send bus, whole track
  sendR: Float64Array;
  length: number; // section length in frames
  at: (localFrame: number) => number; // sample index for a section-local frame (0 = section start); may be fractional
};

export type SectionSound = (ctx: SynthCtx) => void;
