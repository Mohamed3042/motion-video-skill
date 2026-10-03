// Job Orbit v2 — "The Flight": the reel shell. ONE camera flies through ONE 3D space (the Orbit system):
// a WebGL layer (planet, stars, real 3D illusions) under a CSS-3D layer (crisp UI holograms), both seen
// through engine/camera.ts. Sections are mounted only near their time window. HUD/finish/shake on top.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {DURATION, PAD, SECTIONS as ORBIT_SECTIONS, type SectionId} from './timing';
import {SECTION_IMPL} from './sections';
import {FADE} from './finale/timing';
import {FW_EVENTS} from './shell/timing';
import {Finish, Hud} from './shell/hud';
import {ease, prog} from './shell/util';
import {GLLayer, SectionGL} from './engine/gl';
import {SectionSpace, Space} from './engine/space';
import {CAM_SECTIONS, type CamId} from './engine/camera';
import {Environment, FlightFX} from './shell/environment';
import {World as FinaleWorld} from './finale/World';
import {GL as FinaleGL} from './finale/GL';

const IMPL: Record<CamId, {World: React.FC; GL: React.FC | null}> = {...SECTION_IMPL, finale: {World: FinaleWorld, GL: FinaleGL}};

/** Mount margin: a section is alive from MARGIN frames before its start to MARGIN after its end (approach/departure). */
export const MARGIN = 150;
const alive = (g: number) => CAM_SECTIONS.filter((s) => g >= s.start - MARGIN && g < s.end + MARGIN);

// Camera shake (screen space, smooth): sum of sines under a 20-frame decaying envelope, strongest event per frame.
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
  return a ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(1 + (a * 3.2) / 1080).toFixed(4)})` : undefined;
};

/** The whole picture for global frame g (used by the reel and by the solo composition). */
export const Picture: React.FC<{only?: CamId}> = ({only}) => {
  const g = useCurrentFrame();
  const live = alive(g).filter((s) => !only || s.id === only);
  return (
    <AbsoluteFill style={{transform: shakeAt(g)}}>
      <GLLayer>
        <Environment />
        {live.map((s) => {
          const GL = IMPL[s.id].GL;
          return GL ? (
            <SectionGL key={s.id} id={s.id}>
              <GL />
            </SectionGL>
          ) : null;
        })}
      </GLLayer>
      <Space>
        {live.map((s) => {
          const World = IMPL[s.id].World;
          return (
            <SectionSpace key={s.id} id={s.id}>
              <World />
            </SectionSpace>
          );
        })}
      </Space>
      <FlightFX />
    </AbsoluteFill>
  );
};

export const OrbitReel: React.FC = () => {
  const g = useCurrentFrame();
  const fade = ease.cubicInOut(prog(g, FADE, DURATION - 1));
  return (
    <AbsoluteFill style={{background: C.deep, overflow: 'hidden'}}>
      <Picture />
      <Finish />
      <Hud />
      <AbsoluteFill style={{background: C.deep, opacity: fade}} />
      <Audio src={staticFile('orbit2/music.wav')} />
    </AbsoluteFill>
  );
};

// Debug composition: one section through the REAL camera, local frame 0 at composition frame PAD
// (composition frame f → global frame start - PAD + f). Other sections are hidden. Keep this export stable.
export const OrbitSectionSolo: React.FC<{id: SectionId | 'finale'}> = ({id}) => {
  const s = CAM_SECTIONS.find((x) => x.id === id)!;
  return (
    <AbsoluteFill style={{background: C.deep, overflow: 'hidden'}}>
      <Sequence from={-(s.start - PAD)} layout="none">
        <Picture only={id} />
        <Finish />
        <Hud />
      </Sequence>
    </AbsoluteFill>
  );
};
