import type {WorldEvent} from '../../timing';

// World 6 · SOUND LAB (sage). Local frames (0 = world start; beat = 30 f, bar = 120 f).
// Imported by World.tsx AND scripts/mpw/worlds/sound.ts (+ sound-spectro.ts). Plain TS only.

export const WORD = 'MONTAGE';
export const LETTER_F0 = 120; // M reaches the playhead on bar 2's downbeat
export const LETTER_STEP = 40; // half-note triplets: 3 letters per 2 beats
export const LETTER_LEN = 32; // each letter lasts 32 f, then an 8 f gap
export const LETTER_F = [...WORD].map((_, i) => LETTER_F0 + i * LETTER_STEP);
export const WORD_END = LETTER_F[6] + LETTER_LEN; // 392

export const T = {
  hum: 40, // the "recording" starts humming (fades in to f90)
  reveal: 96, // the waveform unfolds into the spectrogram
  move: 100, // the playhead starts travelling (the view holds still while the word is written)
  repairUi: 318, // AUDIO REPAIR controls slide in
  select: 384, // the hum band + the clicks get selected (silent UI move)
  repair: 420, // IMPACT: Process audio. Hum and clicks stop; the history wipes to the processed spectrogram
  dock: 466, // spectrogram docks into the bottom strip
  exit: 1020, // the strip lifts and condenses into the RGB band
  band: 1056, // exit pose: RGB light band
} as const;

export type ToolId = 'mixer' | 'noise' | 'mic' | 'room' | 'leveler' | 'loudness' | 'beats' | 'speech';
export const TOOLS: {id: ToolId; name: string; line: string; f: number; len: number}[] = [
  {id: 'mixer', name: 'DIALOGUE MIXER', line: 'Shape tone and control dynamics.', f: 480, len: 60},
  {id: 'noise', name: 'DIALOGUE NOISE', line: 'Reduce background noise.', f: 540, len: 60},
  {id: 'mic', name: 'MICROPHONE ALIGNMENT', line: 'Keep microphone recordings together.', f: 600, len: 90},
  {id: 'room', name: 'ROOM REDUCTION', line: 'Reduce late room reflections.', f: 690, len: 60},
  {id: 'leveler', name: 'DIALOGUE LEVELER', line: 'Smooth changing dialogue levels.', f: 750, len: 60},
  {id: 'loudness', name: 'LOUDNESS DELIVERY', line: 'Measure and meet your loudness target.', f: 810, len: 90},
  {id: 'beats', name: 'BEAT MARKERS', line: 'Find onsets and export markers.', f: 900, len: 60},
  {id: 'speech', name: 'SPEECH CLEANUP', line: 'Make dialogue easier to follow.', f: 960, len: 60},
];

// tool gestures (each one is heard AND seen on its frame)
export const G = {
  presence: 510, // mixer: tone curve + compressor engage
  noiseOff: 570, // noise floor drops
  align: 630, // two mics snap into phase: the cancelled tone doubles
  flip: 660, // polarity inverted: cancels again …
  unflip: 675, // … polarity corrected: doubles
  dry: 720, // the echo trails collapse into one dry stab
  level: 780, // leveler engages under the ceiling
  pass2: 840, // loudness: second pass (normalize)
  target: 870, // meter lands on Target
  clean: 990, // speech cleanup engages
} as const;
export const ONSETS = [900, 915, 922, 930, 945, 952]; // beat markers: onset candidates (16th grid, rounded)
// click specks in the "recording" (AUDIO REPAIR softens them away); fractional frames
export const CLICKS = [106.4, 127.9, 141.2, 158.7, 176.3, 189.6, 214.8, 229.1, 253.5, 266.2, 291.7, 308.4, 336.9, 349.3, 371.8, 398.5, 411.2];

export const EVENTS: WorldEvent[] = [
  {f: 0, kind: 'hit'}, // the package lid bursts open, the waveform pours out
  ...LETTER_F.map((f) => ({f, kind: 'blip' as const})), // each letter of MONTAGE starts at the playhead
  {f: T.repair, kind: 'impact', shake: 7},
  ...TOOLS.map((t) => ({f: t.f, kind: 'tick' as const})),
  {f: G.presence, kind: 'tick'},
  {f: G.noiseOff, kind: 'hit'},
  {f: G.align, kind: 'hit'},
  {f: G.flip, kind: 'tick'},
  {f: G.unflip, kind: 'hit'},
  {f: G.dry, kind: 'hit'},
  {f: G.level, kind: 'hit'},
  {f: G.pass2, kind: 'tick'},
  {f: G.target, kind: 'impact', shake: 5},
  ...ONSETS.slice(1).map((f) => ({f, kind: 'tick' as const})), // (900 is the tool tick)
  {f: G.clean, kind: 'hit'},
  {f: T.exit, kind: 'tick'},
  {f: 1076, kind: 'whoosh'}, // marked at its peak, into Picture Lab
];
// Local frame the finale montage freezes on: the clean MONTAGE spectrogram, full word on screen.
export const HERO_FRAME = 452;
