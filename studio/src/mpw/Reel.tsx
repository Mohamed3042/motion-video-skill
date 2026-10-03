// Montage Pro: Eleven Worlds — the reel shell. Intro, the eleven worlds and the finale, stitched by twelve
// editor's cuts, under one camera shake, the finish layers, the NLE HUD and the master soundtrack.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {DURATION, PAD, WORLDS, type WorldId} from './timing';
import {WORLD_IMPL} from './worlds';
import {Intro} from './intro/Intro';
import {Finale} from './finale/Finale';
import {FADE} from './finale/timing';
import {FW_EVENTS, SECTIONS, type SectionId} from './shell/timing';
import {ACTIVE, EDIT_IMPL, EditOverlay, editP, type Look} from './shell/edits';
import {Finish, Hud} from './shell/hud';
import {ease, prog} from './shell/util';

const COMPONENT: Record<SectionId, React.FC> = {
  intro: Intro,
  finale: Finale,
  ...(Object.fromEntries(WORLDS.map((w) => [w.id, WORLD_IMPL[w.id].World])) as Record<WorldId, React.FC>),
};

// Camera shake: smooth sum of sines under a 20-frame decaying envelope, on every event that asks for it.
const SHAKES = [
  ...FW_EVENTS.filter((e) => e.shake).map((e) => ({f: e.f, amp: e.shake!})),
  ...WORLDS.flatMap((w) => WORLD_IMPL[w.id].EVENTS.filter((e) => e.shake).map((e) => ({f: w.start + e.f, amp: e.shake!}))),
];
const shakeAt = (g: number) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const s of SHAKES) {
    const t = g - s.f;
    if (t < 0 || t >= 20) continue;
    const env = (1 - t / 20) ** 2;
    const k = s.f * 0.37;
    x += s.amp * env * (0.65 * Math.sin(t * 0.95 + k) + 0.35 * Math.sin(t * 1.73 + 2.1 * k));
    y += s.amp * env * (0.65 * Math.cos(t * 0.83 + 1.3 * k) + 0.35 * Math.sin(t * 2.11 + k));
    r += 0.3 * (s.amp / 14) * env * Math.sin(t * 0.7 + k);
  }
  return x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)` : undefined;
};

// One section inside its Sequence: mounted from its incoming edit's start to its outgoing edit's end,
// styled by the incoming edit (around its start) and the outgoing edit (around its end).
const Shot: React.FC<{i: number}> = ({i}) => {
  const s = SECTIONS[i];
  const g = useCurrentFrame() + s.start - PAD;
  const ein = i > 0 ? EDIT_IMPL[i - 1] : null;
  const eout = i < EDIT_IMPL.length ? EDIT_IMPL[i] : null;
  if (ein && g < s.start - (ein.lead ?? ACTIVE)) return null;
  if (eout && g > s.end + ACTIVE) return null;
  const looks: Look[] = [];
  if (ein?.inn && g <= s.start + ACTIVE) looks.push(ein.inn(editP(g, s.start), g - s.start));
  if (eout?.out && g >= s.end - ACTIVE) looks.push(eout.out(editP(g, s.end), g - s.end));
  if (looks.some((l) => l.hide)) return null;
  const style = Object.assign({}, ...looks.map((l) => l.style)) as React.CSSProperties;
  const dim = Math.max(0, ...looks.map((l) => l.dim ?? 0));
  const flash = Math.max(0, ...looks.map((l) => l.flash ?? 0));
  const Comp = COMPONENT[s.id];
  return (
    <AbsoluteFill style={{...style, zIndex: looks.some((l) => l.top) ? 2 : 0, overflow: 'hidden'}}>
      <Comp />
      {dim > 0 ? <AbsoluteFill style={{background: '#000000', opacity: dim}} /> : null}
      {flash > 0 ? <AbsoluteFill style={{background: '#FFF8EA', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

export const MpwReel: React.FC = () => {
  const g = useCurrentFrame();
  const fade = ease.cubicInOut(prog(g, FADE, DURATION - 1));
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: shakeAt(g)}}>
        {SECTIONS.map((s, i) => (
          <Sequence key={s.id} from={s.start - PAD} durationInFrames={s.end - s.start + 2 * PAD} name={`${String(s.index).padStart(2, '0')} ${s.name}`} layout="none">
            <Shot i={i} />
          </Sequence>
        ))}
        <EditOverlay g={g} />
      </AbsoluteFill>
      <Finish />
      <Hud />
      <AbsoluteFill style={{background: C.canvas, opacity: fade}} />
      <Audio src={staticFile('mpw/music.wav')} />
    </AbsoluteFill>
  );
};

// Debug composition: one world alone, local frame 0 at composition frame PAD. Used by world builders.
export const MpwWorldSolo: React.FC<{id: WorldId}> = ({id}) => {
  const {World} = WORLD_IMPL[id];
  return (
    <AbsoluteFill style={{background: C.canvas}}>
      <World />
    </AbsoluteFill>
  );
};
