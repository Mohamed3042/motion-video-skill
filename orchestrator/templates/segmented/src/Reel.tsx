// __TITLE__ — the reel shell (owned by the framework job; this is the scaffold's starting point).
// Intro, segments and outro in Sequences that overlap by PAD frames, a crossfade at every boundary,
// one camera shake driven by every impact/hit that asks for it, and the master soundtrack.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {PAD, SECTIONS, SEGMENTS, type SectionId} from './timing';
import {SEG_IMPL} from './segments';
import {FW_EVENTS} from './shell/timing';
import {Intro} from './intro/Intro';
import {Outro} from './outro/Outro';
import {clamp} from './util';

const COMPONENT = {
  intro: Intro,
  outro: Outro,
  ...Object.fromEntries(SEGMENTS.map((s) => [s.id, SEG_IMPL[s.id].World])),
} as Record<SectionId, React.FC>;

// Camera shake: smooth sum of sines under a 20-frame decaying envelope (never per-frame jitter).
const SHAKES = [
  ...FW_EVENTS.filter((e) => e.shake).map((e) => ({f: e.f, amp: e.shake!})),
  ...SEGMENTS.flatMap((s) => SEG_IMPL[s.id].EVENTS.filter((e) => e.shake).map((e) => ({f: s.start + e.f, amp: e.shake!}))),
];
const shakeAt = (g: number) => {
  let x = 0;
  let y = 0;
  for (const s of SHAKES) {
    const t = g - s.f;
    if (t < 0 || t >= 20) continue;
    const env = (1 - t / 20) ** 2;
    const k = s.f * 0.37;
    x += s.amp * env * (0.65 * Math.sin(t * 0.95 + k) + 0.35 * Math.sin(t * 1.73 + 2.1 * k));
    y += s.amp * env * (0.65 * Math.cos(t * 0.83 + 1.3 * k) + 0.35 * Math.sin(t * 2.11 + k));
  }
  return x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : undefined;
};

// One section inside its Sequence; it fades in across its start boundary (over the previous section's tail).
const Shot: React.FC<{i: number}> = ({i}) => {
  const s = SECTIONS[i];
  const g = useCurrentFrame() + s.start - PAD;
  const opacity = i === 0 ? 1 : clamp((g - (s.start - PAD)) / (2 * PAD));
  const Comp = COMPONENT[s.id];
  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden'}}>
      <Comp />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  const g = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: shakeAt(g)}}>
        {SECTIONS.map((s, i) => (
          <Sequence key={s.id} from={s.start - PAD} durationInFrames={s.end - s.start + 2 * PAD} name={`${String(s.index).padStart(2, '0')} ${s.name}`} layout="none">
            <Shot i={i} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Audio src={staticFile('__SLUG__/music.wav')} />
    </AbsoluteFill>
  );
};
