// Contract between the master music script and each world's sound module (scripts/mkv/worlds/<id>.ts).
// A world module default-exports `render(ctx)` and writes its sound into ctx.L/R (dry) and ctx.sendL/R (reverb send).
// Write roughly within [at(-15), at(length + 15)]; quiet tails may run up to ~0.5 s past the world end.
// Level target inside the world's range: peaks around -6 dBFS, about -16 LUFS. The master matches worlds to each other.

export type SynthCtx = {
  SR: number; // 44100
  L: Float64Array; // dry bus, whole track
  R: Float64Array;
  sendL: Float64Array; // reverb send bus, whole track
  sendR: Float64Array;
  length: number; // world length in frames
  at: (localFrame: number) => number; // sample index for a world-local frame (0 = world start); may be fractional
};

export type WorldSound = (ctx: SynthCtx) => void;
