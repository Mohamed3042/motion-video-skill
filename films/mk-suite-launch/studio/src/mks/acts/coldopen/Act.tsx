// Act 0 · Cold open (0–600): shards of real product art in the dark → a rush, one word per passing card →
// "One place for all of it." → the nine Explore tiles fly into their exact tiles and the window materializes.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {C, FONT} from '../../brand';
import {useActFrame} from '../../frame';
import {Backdrop, Crop, Super, WINDOW_RECT, clamp, ease, kf, lerp, prog, springAt, type Rect} from '../../kit';
import {Card, type CardPose} from './Card';
import {ExploreWindow, SEAM_RIM, SEAM_W} from './seam';
import {SHARDS} from './shards';
import {BOKEH, CARDS, DUST, F, FLY, LAND, STOP, WORDS, ZW, camT, camXY, type CardSpec} from './world';

const rgb = (hex: string) => `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
const HUE: Record<string, string> = Object.fromEntries(SHARDS.map((s) => [s.name, rgb(s.hue)]));

const RUSH: [number, number] = [222, 468]; // motion-blurred stretch



// Global look over time
const fadeIn = (f: number) => ease.out(prog(f, -4, 70));
const focus = (f: number) => kf(f, [[0, 2600], [200, 2600], [244, 1450], [412, 1450], [470, 3000], [522, 1700], [STOP, F]]);
const AP = 15; // aperture (world px): circle of confusion = AP·F·|1/focus − 1/d|

const pose = (c: CardSpec, f: number): CardPose | null => {
  const T = camT(f);
  const cam = camXY(f);
  let {x, y, z} = c;
  if (c.kind === 'filler') y += 18 * Math.sin(f * 0.02 + c.glint * 0.1); // slow float
  let rx = c.rx;
  let ry = c.ry + c.spin * f * 6;
  let rz = c.rz + c.spin * f;
  let glass = 1;
  let flash = 0;
  let radiusBottom = 1;
  let o = c.appear ? ease.out(prog(f, c.glint - 2, c.glint + 16)) : fadeIn(f);
  if (c.kind === 'grid' && c.grid) {
    const g = c.grid;
    const land = LAND[g.row];
    const p = ease.quintInOut(prog(f, land - FLY + g.col * 3, land));
    const q = 1 - (1 - p) ** 2;
    const gather = 1 - 0.14 * ease.inOut(prog(f, 410, 500)); // the ring tightens around the super
    x = lerp(c.x * gather, g.x, p);
    y = lerp(c.y * gather, g.y, p);
    z = lerp(c.z, ZW, p);
    rx = lerp(rx, 0, q);
    ry = lerp(ry, 0, q);
    rz = lerp(rz, 0, q);
    glass = 1 - ease.inOut(prog(f, land - 6, land + 10));
    radiusBottom = glass;
    flash = f >= land ? Math.max(0, 1 - (f - land) / 16) : 0;
    o *= 1 - prog(f, 582, 592);
    if (f >= 592) return null;
  } else {
    // everything else makes room for the nine tiles; heroes only appear for their own beat
    if (c.beat !== undefined) o *= ease.out(prog(f, c.beat - (c.beat >= 360 ? 30 : 42), c.beat - (c.beat >= 360 ? 22 : 30)));
    o *= 1 - ease.inOut(prog(f, 462, 520));
    if (f >= 520) return null;
  }
  const d = z - T;
  if (d < 140) return null;
  o *= clamp((d - 140) / 220); // near plane
  o *= clamp((12000 - d) / 6000); // distance fog: the deep center stays calm (bokeh discs carry the depth)
  const s = F / d;
  const w = c.w * s;
  const X = 960 + (x - cam.x) * s;
  const Y = 540 + (y - cam.y) * s;
  if (X + w < -200 || X - w > 2120 || Y + w < -400 || Y - w > 1480) return null;
  const coc = AP * F * Math.abs(1 / focus(f) - 1 / d);
  const gl = (f - c.glint) % 240;
  return {
    shard: c.shard,
    hue: HUE[c.shard],
    X,
    Y,
    w,
    aspect: c.aspect,
    rx,
    ry,
    rz,
    o,
    blur: c.kind === 'grid' && f > LAND[c.grid!.row] - 4 ? 0 : coc / w,
    glass,
    glint: gl >= 0 && gl < 44 ? gl / 44 : -1,
    flash,
    radiusBottom,
  };
};

// Card field (rendered N times under motion blur during the rush, so it reads its own frame).
const Field: React.FC = () => {
  const f = useActFrame();
  const roll = 1.3 * Math.sin(f * 0.017 + 0.5) * (1 - ease.inOut(prog(f, 440, 530)));
  const poses: Array<{key: string; d: number; p: CardPose}> = [];
  for (const c of CARDS) {
    const p = pose(c, f);
    if (p) poses.push({key: c.key, d: p.w, p});
  }
  poses.sort((a, b) => a.d - b.d); // far (small) first
  return (
    <AbsoluteFill style={{transform: `rotate(${roll}deg)`}}>
      {poses.map((q) => (
        <Card key={q.key} p={q.p} />
      ))}
    </AbsoluteFill>
  );
};

// Dust streaks: each mote drawn from where it was 0.9 f ago to where it is now (analytic motion blur).
const Dust: React.FC<{f: number}> = ({f}) => {
  if (f < 200 || f > 480) return null;
  const roll = 1.3 * Math.sin(f * 0.017 + 0.5) * (1 - ease.inOut(prog(f, 440, 530)));
  const at = (x: number, y: number, z: number, g: number) => {
    const d = z - camT(g);
    const c = camXY(g);
    return d > 60 ? {X: 960 + ((x - c.x) * F) / d, Y: 540 + ((y - c.y) * F) / d, s: F / d, d} : null;
  };
  return (
    <AbsoluteFill style={{transform: `rotate(${roll}deg)`, mixBlendMode: 'screen'}}>
      {DUST.map((m, i) => {
        const a = at(m.x, m.y, m.z, f);
        const b = at(m.x, m.y, m.z, f - 0.9);
        if (!a || !b || a.d > 7000) return null;
        const dx = a.X - b.X;
        const dy = a.Y - b.Y;
        const len = Math.hypot(dx, dy);
        const th = Math.max(1, m.size * a.s);
        if (a.X < -100 || a.X > 2020 || a.Y < -100 || a.Y > 1180) return null;
        const o = m.a * clamp((7000 - a.d) / 3000) * clamp((a.d - 60) / 200) * (1 - prog(f, 440, 480));
        const col = m.green ? '120,255,170' : '230,240,255';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.X,
              top: b.Y - th / 2,
              width: len + th,
              height: th,
              borderRadius: th,
              opacity: o,
              transformOrigin: `0 ${th / 2}px`,
              transform: `rotate(${Math.atan2(dy, dx)}rad)`,
              background: `linear-gradient(90deg, rgba(${col},0) 0%, rgba(${col},0.9) 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Bokeh: React.FC<{f: number}> = ({f}) => {
  const T = camT(f);
  const cam = camXY(f);
  const beat = f < 240 && f >= 0 ? Math.exp(-(f % 30) / 6) : 0;
  const o = fadeIn(f) * (1 - prog(f, 520, 570)) * (1 + 0.7 * beat);
  if (o <= 0) return null;
  return (
    <AbsoluteFill>
      {BOKEH.map((b, i) => {
        const d = b.z - T;
        if (d < 400) return null;
        const s = F / d;
        const size = b.size * s * 3;
        const X = 960 + (b.x - cam.x * 0.3) * s;
        const Y = 540 + (b.y - cam.y * 0.3) * s;
        const tw = 0.75 + 0.25 * Math.sin(f * 0.05 + b.ph);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: X - size / 2,
              top: Y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              opacity: Math.min(1, b.a * o * tw * clamp((d - 400) / 1200)),
              background: `radial-gradient(circle, rgba(${b.hue},0.9) 0%, rgba(${b.hue},0.35) 38%, rgba(${b.hue},0) 70%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// The Explore window assembles around the landed tiles: a dark glass backplate fades up, each tile card's body
// drops open beneath its landed art, then the header, filter chips, top bar and sidebar slide into place.
// Every piece is a crop of the real screen at its exact spot, so the finished stack IS the screen (swap at DONE).
const DONE = 586;
const TILE_COL = [{x: 302, w: 411}, {x: 727, w: 410}, {x: 1151, w: 411}];
// row 3 cards end at y 946: the window trim (936) cuts their last 10 px, exactly as the window shows them
const TILE_ROW = [{y: 264, h: 218, art: 139}, {y: 499, h: 218, art: 139}, {y: 733, h: 203, art: 135}];
const PIECES: Array<{r: Rect; t: number; dx: number; dy: number}> = [
  {r: {x: 300, y: 90, w: 640, h: 100}, t: 536, dx: 0, dy: 34}, // "Find your next tool." + subline
  {r: {x: 300, y: 196, w: 1266, h: 54}, t: 542, dx: 0, dy: 24}, // filter chips + platform menu
  {r: {x: 296, y: 14, w: 1274, h: 58}, t: 546, dx: 0, dy: -36}, // top bar
  {r: {x: 0, y: 0, w: 271, h: 936}, t: 550, dx: -90, dy: 0}, // sidebar
];
const Piece: React.FC<{r: Rect; k: number; dx?: number; dy?: number; o?: number; clipBottom?: number}> = ({r, k, dx = 0, dy = 0, o = 1, clipBottom = 0}) =>
  o <= 0 ? null : (
    <div style={{position: 'absolute', left: r.x * k, top: r.y * k, opacity: o, transform: `translate(${dx * k}px, ${dy * k}px)`, clipPath: clipBottom > 0 ? `inset(0 0 ${clipBottom * k}px 0)` : undefined}}>
      <Crop id="04-explore" rect={r} scale={k} />
    </div>
  );

const Materialize: React.FC<{f: number}> = ({f}) => {
  if (f < 520) return null;
  const s = F / (ZW - camT(f)); // window plane scale relative to the seam (→ 1 at STOP)
  const width = SEAM_W * s;
  if (f >= DONE) return <ExploreWindow width={width} />;
  const k = width / WINDOW_RECT.w;
  const h = WINDOW_RECT.h * k;
  const plate = ease.inOut(prog(f, 522, 556));
  const rad = 16 * k;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 960 - width / 2,
          top: 540 - h / 2,
          width,
          height: h,
          borderRadius: rad,
          opacity: plate,
          background: 'rgb(14,14,14)',
          boxShadow: `0 40px 120px rgba(0,0,0,0.75), 0 0 0 1px ${C.line}, 0 0 ${60 * SEAM_RIM}px rgba(30,215,96,${0.18 * SEAM_RIM})`,
        }}
      />
      <div style={{position: 'absolute', left: 960 - width / 2, top: 540 - h / 2, width, height: h, borderRadius: rad, overflow: 'hidden'}}>
        {TILE_ROW.flatMap((row, ri) =>
          TILE_COL.map((col, ci) => {
            const land = LAND[ri];
            const open = ease.out(prog(f, land + 2, land + 18));
            const body = row.h - row.art;
            return f < land ? null : (
              <Piece key={`${ri}-${ci}`} r={{x: col.x, y: row.y, w: col.w, h: row.h}} k={k} o={prog(f, land, land + 4)} clipBottom={body * (1 - open)} />
            );
          }),
        )}
        {PIECES.map((p, i) => {
          const a = springAt(f, p.t, {stiffness: 120, damping: 16});
          return <Piece key={i} r={p.r} k={k} dx={p.dx * (1 - a)} dy={p.dy * (1 - a)} o={Math.min(1, prog(f, p.t, p.t + 12))} />;
        })}
        <div style={{position: 'absolute', inset: 0, borderRadius: rad, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', opacity: plate}} />
      </div>
    </>
  );
};

// One rush word: lands hard on its beat, then is passed by the camera just before the next word lands.
const RushWord: React.FC<{f: number; text: string; at: number; next: number}> = ({f, text, at, next}) => {
  if (f < at - 2 || f >= next - 2) return null;
  const a = ease.out(prog(f, at - 3, at + 5));
  const out = ease.in(prog(f, next - 8, next - 2));
  const scale = lerp(1.22, 1, a) * lerp(1, 1.55, out);
  const blur = 14 * (1 - a) + 12 * out;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 132,
          letterSpacing: -132 * 0.035,
          color: C.fg,
          opacity: Math.min(1, a * 1.6) * (1 - out),
          transform: `scale(${scale})`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          textShadow: '0 0 50px rgba(0,0,0,0.7)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const Act: React.FC = () => {
  const f = useActFrame();
  if (f >= STOP + 2) {
    // held seam state (identical to act 1, local frame 0)
    return (
      <AbsoluteFill style={{background: C.stage}}>
        <Backdrop f={f} glow={0.9} />
        <ExploreWindow />
      </AbsoluteFill>
    );
  }
  const rush = f >= RUSH[0] && f < RUSH[1];
  return (
    <AbsoluteFill style={{background: C.stage}}>
      <Backdrop f={f} glow={kf(f, [[0, 0], [60, 0.25], [400, 0.25], [560, 0.9]])} />
      <Bokeh f={f} />
      <Materialize f={f} />
      {rush ? (
        <CameraMotionBlur samples={6} shutterAngle={200}>
          <Field />
        </CameraMotionBlur>
      ) : (
        <Field />
      )}
      <Dust f={f} />
      {/* type */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textShadow: '0 0 40px rgba(0,0,0,0.6)'}}>
        <Super f={f} text="You make a lot of things." start={120} end={206} size={104} />
      </AbsoluteFill>
      {WORDS.map((w) => (
        <RushWord key={w.word} f={f} text={w.word} at={w.f} next={w.next} />
      ))}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textShadow: '0 0 40px rgba(0,0,0,0.6)'}}>
        <Super f={f} text="One place for all of it." start={420} end={484} size={112} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

