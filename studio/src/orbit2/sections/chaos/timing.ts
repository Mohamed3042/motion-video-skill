import {mulberry32, type SectionEvent} from '../../timing.ts';

// Act 1 · The noise (0–720). Local frames, 120 BPM (beat = 30 f). Shared by World.tsx and scripts/orbit2/sections/chaos.ts.
export const HOOK = 30; // hard hit + first notification ping cuts the black
export const LINES = [
  {f: 120, text: 'Another tab.', to: [430, 230], rot: -7},
  {f: 210, text: 'Another listing.', to: [1480, 260], rot: 6},
  {f: 300, text: 'Still open?', to: [420, 840], rot: 5},
  {f: 360, text: 'Do I even qualify?', to: [1500, 850], rot: -5},
  {f: 420, text: 'Which CV is the true one?', to: [1180, 150], rot: 4},
  {f: 480, text: 'What should I learn next?', to: [960, 560], rot: 0},
] as const;
export const SQUEEZE = 536; // everything starts rushing into one cloud
export const HEADLINE = 570; // 9.5 s "The job hunt is noise." (holds to the cut)
export const CUT = 716; // the roar sucks out ~60 ms before the turn's ignite

const HITS = [HOOK, ...LINES.map((l) => l.f), HEADLINE];
const nearHit = (f: number) => HITS.some((h) => f > h - 8 && f < h + 3);

// Notification pings (each pops a toast on screen; the sound pans to its x). Accelerating, never right before a hit.
export const PINGS: Array<{f: number; x: number; y: number}> = (() => {
  const rnd = mulberry32(4242);
  const out = [{f: HOOK, x: 960, y: 540}];
  let f = 52;
  while (f < 556) {
    const fi = Math.round(f);
    const x = 250 + rnd() * 1420;
    const y = 150 + rnd() * 780;
    if (!nearHit(fi)) out.push({f: fi, x, y});
    f += (24 - 16 * (f / 556)) * (0.65 + 0.7 * rnd());
  }
  return out;
})();

// Clock: on the beat, then eighths as the pressure builds; stops when the headline lands.
export const TICKS: number[] = [];
for (let f = 60; f < HEADLINE; f += f < 300 ? 30 : 15) TICKS.push(f);

export const EVENTS: SectionEvent[] = ([
  {f: HOOK, kind: 'impact', shake: 8},
  ...LINES.map((l): SectionEvent => ({f: l.f, kind: 'hit'})),
  {f: HEADLINE, kind: 'impact', shake: 12},
  {f: CUT - 4, kind: 'whoosh'},
  ...PINGS.slice(1).map((p): SectionEvent => ({f: p.f, kind: 'blip'})),
  ...TICKS.map((f): SectionEvent => ({f, kind: 'tick'})),
] satisfies SectionEvent[]).sort((a, b) => a.f - b.f);

// Local frame the finale montage freezes on: the roaring cloud under "The job hunt is noise."
export const HERO_FRAME = 640;
