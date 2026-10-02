// Job Engine Orbit — "Your next chapter has coordinates": the reel shell. Chaos, turn, the ten worlds and the finale,
// stitched by portal transitions, under one camera shake, the finish layers, the accent-tinted HUD and the soundtrack.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {DURATION, PAD, SECTIONS as ORBIT_SECTIONS, type SectionId} from './timing';
import {SECTION_IMPL} from './sections';
import {Finale} from './finale/Finale';
import {FADE} from './finale/timing';
import {FW_EVENTS, SECTIONS, type ShellId} from './shell/timing';
import {ACTIVE, PORTALS, PortalOverlay, portalP, type Look} from './shell/portals';
import {Finish, Hud} from './shell/hud';
import {ease, prog} from './shell/util';

const COMPONENT: Record<ShellId, React.FC> = {
  finale: Finale,
  ...(Object.fromEntries(ORBIT_SECTIONS.map((s) => [s.id, SECTION_IMPL[s.id].World])) as Record<SectionId, React.FC>),
};

// Camera shake: smooth sum of sines under a 20-frame decaying envelope, on every event that asks for it
// (framework impacts + every section's EVENTS). One shake per frame (the strongest), so coinciding events don't stack.
const SHAKES = (() => {
  const m = new Map<number, number>();
  const add = (f: number, amp: number) => m.set(f, Math.max(amp, m.get(f) ?? 0));
  for (const e of FW_EVENTS) if (e.shake) add(e.f, e.shake);
  for (const s of ORBIT_SECTIONS) for (const e of SECTION_IMPL[s.id].EVENTS) if (e.shake) add(s.start + e.f, e.shake);
  return [...m.entries()].map(([f, amp]) => ({f, amp}));
})();
const shakeAt = (g: number) => {
  let x = 0;
  let y = 0;
  let r = 0;
  let a = 0;
  for (const s of SHAKES) {
    const t = g - s.f;
    if (t < 0 || t >= 20) continue;
    const env = (1 - t / 20) ** 2;
    const k = s.f * 0.37;
    x += s.amp * env * (0.65 * Math.sin(t * 0.95 + k) + 0.35 * Math.sin(t * 1.73 + 2.1 * k));
    y += s.amp * env * (0.65 * Math.cos(t * 0.83 + 1.3 * k) + 0.35 * Math.sin(t * 2.11 + k));
    r += 0.3 * (s.amp / 14) * env * Math.sin(t * 0.7 + k);
    a += s.amp * env;
  }
  // a matching overscan (smooth, decays with the envelope) so the shaken frame never shows its edges
  return a ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(1 + (a * 3.2) / 1080).toFixed(4)})` : undefined;
};

// One section inside its Sequence: visible from 5 frames before its start to 5 frames after its end,
// styled by the incoming portal (at its start) and the outgoing portal (at its end).
const Shot: React.FC<{i: number}> = ({i}) => {
  const s = SECTIONS[i];
  const g = useCurrentFrame() + s.start - PAD;
  const pin = i > 0 ? PORTALS[i - 1] : null;
  const pout = i < PORTALS.length ? PORTALS[i] : null;
  if (pin && g < s.start - (pin.lead ?? ACTIVE)) return null;
  if (pout && g > s.end + ACTIVE) return null;
  const looks: Look[] = [];
  if (pin?.inn && g <= s.start + ACTIVE) looks.push(pin.inn(portalP(g, s.start), g));
  if (pout?.out && g >= s.end - ACTIVE) looks.push(pout.out(portalP(g, s.end), g));
  if (looks.some((l) => l.hide)) return null;
  const style = Object.assign({}, ...looks.map((l) => l.style)) as React.CSSProperties;
  const dim = Math.max(0, ...looks.map((l) => l.dim ?? 0));
  const flash = Math.max(0, ...looks.map((l) => l.flash ?? 0));
  const Comp = COMPONENT[s.id];
  return (
    <AbsoluteFill style={{...style, zIndex: looks.some((l) => l.top) ? 2 : undefined, overflow: 'hidden'}}>
      <Comp />
      {dim > 0 ? <AbsoluteFill style={{background: C.deep, opacity: dim}} /> : null}
      {flash > 0 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

export const OrbitReel: React.FC = () => {
  const g = useCurrentFrame();
  const fade = ease.cubicInOut(prog(g, FADE, DURATION - 1));
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: shakeAt(g)}}>
        {SECTIONS.map((s, i) => (
          <Sequence key={s.id} from={s.start - PAD} durationInFrames={s.end - s.start + 2 * PAD} name={`${String(s.index).padStart(2, '0')} ${s.name}`} layout="none">
            <Shot i={i} />
          </Sequence>
        ))}
        <PortalOverlay g={g} />
      </AbsoluteFill>
      <Finish />
      <Hud />
      <AbsoluteFill style={{background: C.bg, opacity: fade}} />
      <Audio src={staticFile('orbit/music.wav')} />
    </AbsoluteFill>
  );
};

// Debug composition: one section alone, local frame 0 at composition frame PAD. Used by section builders.
// Keep this export stable (the framework builder must preserve it).
export const OrbitSectionSolo: React.FC<{id: SectionId}> = ({id}) => {
  const {World} = SECTION_IMPL[id];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <World />
    </AbsoluteFill>
  );
};
