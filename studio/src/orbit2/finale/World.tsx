// Finale (6120–7200), CSS-3D in world coords.
// - The constellation: on each montage beat, that station's own World — frozen on its HERO_FRAME — springs in as a
//   hologram at its station (turned to face the camera, enlarged), with its "0N / 10" name tag; all ten stay lit
//   until the rings converge, then shrink into their beacons.
// - The lock (6480): the real logo PNG lands over the WebGL planet (masked to the logo shapes), white-hot flash,
//   coral glint on the satellite; the end card (v1 copy, verbatim) sits in 3D under the risen logo while the camera
//   eases in. The fade to navy (7080) is the Reel's.
import React from 'react';
import {Freeze, Img, staticFile} from 'remotion';
import {ACCENT, C, FONT, LOGO, MONO} from '../brand';
import {WORLDS} from '../timing';
import {SECTION_IMPL} from '../sections';
import {CAM_SECTIONS} from '../engine/camera';
import {PLACEMENT} from '../engine/layout';
import {add, len, mul, norm, oneToOne, rotY, sub, type V3} from '../engine/math';
import {Card3D, Group3D, SectionSpace, useCam, useWorldFrame} from '../engine/space';
import {sp} from '../shared';
import {LOGO_CARD, LOGO_FOV, satPos} from '../shell/orbit';
import {MASK} from '../sections/turn/World';
import {unproject} from '../sections/chaos/story';
import {clamp, ease, prog, rgba} from '../shell/util';
import {CARD_SHOT} from './shot';
import {CONVERGE, GLINT2, LINES, LOGO_LOCK, MONTAGE_BEATS} from './timing';
import {FINALE} from '../timing';

const pad2 = (n: number) => String(n).padStart(2, '0');
const P40 = oneToOne(40);

// ---------------------------------------------------------------- the constellation of frozen heroes
const HOLO_S = 2.1;
const Holo: React.FC<{k: number; g: number}> = ({k, g}) => {
  const cam = useCam();
  const w = WORLDS[k];
  const beat = MONTAGE_BEATS[k];
  const out = ease.cubicIn(prog(g, CONVERGE - 22 + 2 * k, CONVERGE + 22 + 2 * k));
  if (g < beat - 1 || out >= 1) return null;
  const {World, HERO_FRAME} = SECTION_IMPL[w.id];
  const start = CAM_SECTIONS.find((s) => s.id === w.id)!.start;
  const pl = PLACEMENT[w.id];
  const pop = sp(g, beat, {damping: 12, stiffness: 150, mass: 1});
  const flash = g >= beat ? Math.exp(-(g - beat) / 10) : 0;
  const S = HOLO_S * pop * (1 - out) * (1 + 0.12 * flash);
  if (S < 0.01) return null;
  // turn the hologram's +z toward the camera (yaw, then pitch), in the station's local frame
  const toCam = rotY(sub(cam.pos, pl.origin), -pl.yaw);
  const yaw = (Math.atan2(toCam[0], toCam[2]) * 180) / Math.PI;
  const pitch = (-Math.atan2(toCam[1], Math.hypot(toCam[0], toCam[2])) * 180) / Math.PI;
  // the name tag: constant screen size, under the hologram
  const tagP: V3 = [0, -640 * S - 120, 0];
  const d = len(sub(cam.pos, pl.origin));
  const tag = ease.expoOut(prog(g, beat + 2, beat + 16)) * (1 - prog(g, CONVERGE - 20, CONVERGE));
  const acc = ACCENT[w.id];
  return (
    <SectionSpace id={w.id}>
      <Group3D r={[pitch, yaw, 0]} order="YXZ" s={S}>
        <Freeze frame={start + HERO_FRAME}>
          <World />
        </Freeze>
      </Group3D>
      {tag > 0.01 ? (
        <Card3D p={tagP} billboard s={d / P40} opacity={tag}>
          <div style={{textAlign: 'center', whiteSpace: 'nowrap', transform: `translateY(${(1 - tag) * 14}px)`}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.3em', color: acc}}>{`${pad2(w.index)} / 10`}</div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', color: acc, textShadow: `0 0 18px ${rgba(acc, 0.6)}, 0 2px 10px rgba(2,6,23,0.9)`}}>{w.name}</div>
          </div>
        </Card3D>
      ) : null}
    </SectionSpace>
  );
};

// ---------------------------------------------------------------- lock: glint + flash
const Glint: React.FC<{t: number; size: number}> = ({t, size}) => {
  const k = t < 0 ? 0 : t < 6 ? ease.cubicOut(t / 6) : Math.exp(-(t - 6) / 12);
  if (k < 0.01) return null;
  const L = size * k;
  const rot = 12 + t * 0.6;
  return (
    <svg width={2 * size} height={2 * size} viewBox={`${-size} ${-size} ${2 * size} ${2 * size}`} style={{display: 'block', overflow: 'visible', filter: `drop-shadow(0 0 10px ${C.coral}) drop-shadow(0 0 4px #FFFFFF)`}}>
      <g transform={`rotate(${rot.toFixed(2)})`}>
        <circle r={L * 0.12} fill="#FFFFFF" opacity={k} />
        <polygon points={`${-L},0 0,${-L * 0.035} ${L},0 0,${L * 0.035}`} fill="#FFFFFF" opacity={k} />
        <polygon points={`0,${-L * 0.7} ${L * 0.03},0 0,${L * 0.7} ${-L * 0.03},0`} fill="#FFFFFF" opacity={k} />
        <g transform="rotate(45)">
          <polygon points={`${-L * 0.32},0 0,${-L * 0.02} ${L * 0.32},0 0,${L * 0.02}`} fill="#FFE6DD" opacity={0.8 * k} />
          <polygon points={`0,${-L * 0.32} ${L * 0.02},0 0,${L * 0.32} ${-L * 0.02},0`} fill="#FFE6DD" opacity={0.8 * k} />
        </g>
      </g>
    </svg>
  );
};

/** A card that covers the screen at the camera's 1:1 distance (a flat overlay living in the 3D layer). */
const ScreenCard: React.FC<{children: React.ReactNode; opacity: number}> = ({children, opacity}) => {
  const cam = useCam();
  const P = oneToOne(cam.fov);
  const fwd = norm(sub(cam.target, cam.pos));
  return (
    <Card3D p={add(cam.pos, mul(fwd, P))} billboard w={1920} h={1080} opacity={opacity} near={1} nearFade={2}>
      {children}
    </Card3D>
  );
};

// ---------------------------------------------------------------- end card (v1 copy, verbatim), in 3D under the logo
const CARD_DEPTH = 7000;
const CS = CARD_DEPTH / oneToOne(LOGO_FOV);
const at = (y: number) => unproject(CARD_SHOT, 960, y, CARD_DEPTH);
const line = (g: number, a: number) => ({p: ease.expoOut(prog(g, a, a + 22)), o: prog(g, a, a + 14)});

const EndCard: React.FC<{g: number}> = ({g}) => {
  if (g < LINES[0] - 2) return null;
  const [l0, l1, l2, l3] = LINES.map((x) => line(g, x));
  return (
    <>
      <Card3D p={add(at(551), [0, -26 * (1 - l0.p) * CS, 0])} s={CS} w={1400}>
        <div style={{textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 124, letterSpacing: '-0.04em', lineHeight: 1.05, color: C.ink, whiteSpace: 'nowrap', clipPath: `inset(-20px ${(1 - l0.p) * 50}% -20px ${(1 - l0.p) * 50}%)`, textShadow: '0 12px 40px rgba(2,6,23,0.85)'}}>
          Job Engine <span style={{color: C.coral, textShadow: `0 0 30px ${rgba(C.coral, 0.35)}`}}>Orbit</span>
        </div>
      </Card3D>
      <Card3D p={add(at(662), [0, -22 * (1 - l1.p) * CS, 0])} s={CS} w={1400} opacity={l1.o}>
        <div style={{textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 46, letterSpacing: '-0.01em', color: C.muted, whiteSpace: 'nowrap'}}>Career intelligence for a broader you.</div>
      </Card3D>
      <Card3D p={add(at(751), [0, -18 * (1 - l2.p) * CS, 0])} s={CS} opacity={l2.o}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: '0.28em', color: C.ink, padding: '12px 22px 12px 28px', borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', boxShadow: `0 0 24px ${rgba(C.coral, 0.12)}`}}>
          <span style={{width: 8, height: 8, borderRadius: '50%', background: C.coral, boxShadow: `0 0 8px ${C.coral}`}} />
          WINDOWS · LOCAL PREVIEW
        </div>
      </Card3D>
      <Card3D p={add(at(844), [0, -14 * (1 - l3.p) * CS, 0])} s={CS} w={1400} opacity={0.85 * l3.o}>
        <div style={{textAlign: 'center', fontFamily: FONT, fontWeight: 400, fontSize: 22, letterSpacing: '0.01em', color: C.soft, whiteSpace: 'nowrap'}}>Research with evidence. Applications require review and authorization.</div>
      </Card3D>
    </>
  );
};

export const World: React.FC = () => {
  const g = useWorldFrame() + FINALE.start;
  const cam = useCam();
  const t = g - LOGO_LOCK;
  const flash = t >= 0 ? Math.exp(-t / 7) : 0;
  const sat = satPos(g);
  const toCam = norm(sub(cam.pos, sat));
  const glintP = add(sat, mul(toCam, 400));
  const gs = len(sub(cam.pos, glintP)) / oneToOne(cam.fov);
  return (
    <>
      {WORLDS.map((_, k) => (
        <Holo key={k} k={k} g={g} />
      ))}
      {t >= 0 ? (
        <Card3D p={LOGO_CARD.p} w={512} h={512} s={(LOGO_CARD.size / 512) * (0.86 + 0.14 * ease.backOut(prog(t, 0, 16)))} opacity={prog(t, 0, 3)} near={10} nearFade={20}>
          <Img src={staticFile(LOGO)} style={{width: 512, height: 512, display: 'block', WebkitMaskImage: MASK, maskImage: MASK, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}} />
        </Card3D>
      ) : null}
      {t >= 0 ? (
        <Card3D p={glintP} billboard s={gs} near={10} nearFade={20}>
          <div style={{position: 'relative', width: 0, height: 0}}>
            <div style={{position: 'absolute', left: -230, top: -230}}>
              <Glint t={t - 3} size={230} />
            </div>
            <div style={{position: 'absolute', left: -130, top: -130}}>
              <Glint t={g - GLINT2} size={130} />
            </div>
          </div>
        </Card3D>
      ) : null}
      <EndCard g={g} />
      {flash > 0.004 ? (
        <ScreenCard opacity={clamp(0.92 * flash)}>
          <div style={{width: 1920, height: 1080, background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FFE9E1 30%, ${rgba(C.coral, 0.7)} 62%, ${rgba(C.cobalt, 0.5)} 100%)`}} />
        </ScreenCard>
      ) : null}
    </>
  );
};
