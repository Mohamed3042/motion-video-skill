// Act 3 · Work (global 2880–3840). Local frame f: 0 = act start.
// Chapter (whip-in) → Compact library: Work filter → Secret Office: super lands as the page title, glide →
// Activity: rows cascade, panel lifts → camera dives into the Activity glyph, which becomes the Grow icon.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../../brand';
import {Backdrop, Crop, Cursor, Highlight, Stage, Super, WINDOW_RECT, clamp, ease, kf, lerp, prog, springAt} from '../../kit';
import {BarsIcon, ChapterCard, Fill, HBlurDefs, P, Slice, StackIcon, Win, WC, mag, pop, zFor, ACTIVITY_BARS, type Cam3} from './parts';
import {SEAM_CAM0, SEAM_START, seamCam, seamIcon} from './seam';

const LIB = '02-library-compact' as const;
const OFFICE = '14-secret-office' as const;
const ACT = '07-activity' as const;

// ── 02 table geometry (source px) ─────────────────────────────────────────────────────────────────
const B02 = [320, 387, 453, 520, 587, 654, 721, 789, 856, 927];
const rowR = (i: number) => ({x: 303, y: B02[i], w: 886, h: B02[i + 1] - B02[i]});
const WORK_ROWS = [4, 5, 7]; // MacroForge · Reclaim · Cake Studio
const OTHER_ROWS = [0, 1, 2, 3, 6, 8];
const T_CLICK1 = 240;
const LIT = [286, 296, 306];

// ── 07 timeline slices (source px) ────────────────────────────────────────────────────────────────
const B07 = [278, 322, 382, 454, 536, 590, 652, 720, 799, 840, 891]; // stops above y 936 (crop limit)
const T_CLICK3 = 690;
const T_LIFT = 750;
const PANEL = {x: 1075, y: 118, w: 488, h: 536};

// ── Timeline marks ────────────────────────────────────────────────────────────────────────────────
const T_CLICK2 = 450;
const S1 = {start: 330, end: 436}; // Automate the desk work.
const S2 = {start: 480, fly: 510, land: 536}; // Your private desk. → page title
const S3 = {start: 750, end: 886}; // Know what happened. And what's next.

// Catmull-Rom through evenly spaced points, t in [0, n-1].
const cr = (p: number[], t: number) => {
  const n = p.length;
  const i = Math.min(n - 2, Math.max(0, Math.floor(t)));
  const u = t - i;
  const p0 = p[Math.max(0, i - 1)];
  const p1 = p[i];
  const p2 = p[i + 1];
  const p3 = p[Math.min(n - 1, i + 2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
};

// Secret Office glide: wide → hero text → hero glass → office tools list.
const GLIDE = {a: 546, b: 662, x: [0, -215, 250], y: [-141, -125, 215], m: [0.82, 1.3, 1.22]};

// Window transform (world). The same window object travels through the whole act; its content swaps.
const winAt = (f: number) => ({
  x: kf(f, [[150, 1500], [214, 0, ease.expoOut], [298, 0], [340, 560, ease.inOut], [446, 560], [492, 0, ease.inOut]]),
  z: kf(f, [[150, -2600], [214, 0, ease.expoOut]]),
  ry: kf(f, [[150, -40], [214, 0, ease.expoOut], [298, 0], [340, -14, ease.inOut], [446, -14], [492, 0, ease.inOut], [T_LIFT, 0], [T_LIFT + 70, -11, ease.inOut], [866, -11], [896, 0, ease.inOut]]),
  rx: kf(f, [[150, 8], [210, 0, ease.expoOut]]),
});

export const camAt = (f: number): Cam3 => {
  if (f >= 960 + SEAM_START) return seamCam(f - 960);
  if (f >= GLIDE.a && f < GLIDE.b) {
    const t = ease.inOut(prog(f, GLIDE.a, GLIDE.b)) * (GLIDE.x.length - 1);
    return {x: cr(GLIDE.x, t), y: cr(GLIDE.y, t), z: zFor(cr(GLIDE.m, t))};
  }
  const keys = (sel: (k: [number, number, number]) => number) =>
    kf(
      f,
      (
        [
          [150, [0, 0, 1]],
          [210, [0, 0, 1]],
          [T_CLICK1, [-150, -100, 1.12]],
          [298, [-120, -40, 1.2]],
          [340, [-60, -83, 1.12]],
          [446, [-50, -70, 1.15]],
          [492, [0, -141, 0.82]],
          [GLIDE.a, [0, -141, 0.82]],
          [GLIDE.b, [250, 215, 1.22]],
          [688, [0, 64, 0.93]],
          [T_LIFT, [0, 64, 0.93]],
          [850, [120, 96, 1.0]],
          [960 + SEAM_START, [SEAM_CAM0.x, SEAM_CAM0.y, mag(0, SEAM_CAM0.z)]],
        ] as Array<[number, [number, number, number]]>
      ).map(([kfF, v]) => [kfF, sel(v)] as [number, number]),
    );
  return {x: keys((v) => v[0]), y: keys((v) => v[1]), z: zFor(keys((v) => v[2]))};
};

// ── Chapter: "Work." enters on the whip-pan (leftward), then drifts on and fades for the window ─────────
const WorkChapter: React.FC<{f: number}> = ({f}) => {
  const X: Array<[number, number, ((t: number) => number)?]> = [[-12, 820], [26, 0, ease.expoOut], [134, -30, ease.linear], [160, -560, ease.in]];
  const x = kf(f, X);
  const v = Math.abs(kf(f + 1, X) - x);
  const out = ease.in(prog(f, 136, 160));
  const layers: [number, number, number] = [pop(f, -20), pop(f, 0), pop(f, 8)];
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px) scale(${1 + 0.035 * ease.inOut(prog(f, 10, 160))})`, filter: v > 1 ? 'url(#wk-hb)' : undefined}}>
      <HBlurDefs id="wk-hb" sx={Math.min(40, v * 0.55)} />
      <ChapterCard
        f={f}
        start={-34}
        index="03 — WORK"
        word="Work."
        sub="Tools that fit your workflow."
        x0={532}
        out={out}
        icon={<StackIcon size={210} layers={layers} glow={1 + 0.6 * Math.max(0, 1 - Math.abs(f) / 20)} />}
      />
    </AbsoluteFill>
  );
};

// ── 02: chips + table that filters to Work ───────────────────────────────────────────────────────
const AllChipOff: React.FC<{o: number}> = ({o}) => (
  <div style={{position: 'absolute', left: 302, top: 212, width: 106, height: 48, borderRadius: 11, background: 'rgb(22,21,23)', border: '1px solid rgb(44,42,45)', boxSizing: 'border-box', opacity: o, display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 23}}>
    <svg width={16} height={16} viewBox="0 0 16 16">
      {[0, 9].flatMap((x) => [0, 9].map((y) => <rect key={`${x}${y}`} x={x} y={y} width={7} height={7} rx={1.5} fill="#EDEDED" />))}
    </svg>
    <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 16, color: '#EDEDED', letterSpacing: -0.2}}>All</div>
  </div>
);

const WorkChipOn: React.FC<{o: number; f: number}> = ({o, f}) => {
  const flash = Math.max(0, 1 - (f - T_CLICK1) / 24);
  const r = {x: 656, y: 214, w: 105, h: 44};
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: o, isolation: 'isolate'}}>
      <Crop id={LIB} rect={r} scale={1} radius={11} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 11, background: C.green, mixBlendMode: 'multiply'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 11, background: 'rgba(12,30,20,0.55)', mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', inset: -1, borderRadius: 12, border: `2px solid ${C.green}`, boxShadow: `0 0 ${10 + 26 * flash}px rgba(30,215,96,${0.35 + 0.5 * flash})`}} />
    </div>
  );
};

const LibraryTable: React.FC<{f: number}> = ({f}) => {
  // per-row dim (o) and collapse (h) factors
  const st = B02.slice(0, 9).map((_, i) => {
    const k = OTHER_ROWS.indexOf(i);
    if (k < 0) return {o: 1, h: 1};
    const d = T_CLICK1 + 2 + k * 3;
    const c = i < 4 ? 254 : i === 6 ? 262 : 268;
    const h = 1 - ease.inOut(prog(f, c, c + 30));
    return {o: (1 - 0.8 * ease.out(prog(f, d, d + 10))) * clamp(h * 1.6), h};
  });
  let y = B02[0];
  const ys = st.map((s, i) => {
    const y0 = y;
    y += (B02[i + 1] - B02[i]) * s.h;
    return y0;
  });
  return (
    <>
      <Fill r={{x: 298, y: 317, w: 896, h: 614}} color="rgb(16,15,15)" />
      <div style={{position: 'absolute', left: 303, top: B02[0] - 1, width: 886, height: y - B02[0] + 2, borderRadius: 10, background: 'rgb(19,18,18)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'}} />
      {st.map((s, i) =>
        s.h <= 0.001 ? null : (
          <Slice key={i} id={LIB} r={rowR(i)} dy={ys[i] - B02[i]} o={s.o} clipH={rowR(i).h * s.h} />
        ),
      )}
      {WORK_ROWS.map((i, k) => {
        const a = ease.out(prog(f, LIT[k], LIT[k] + 14));
        const sweep = prog(f, LIT[k], LIT[k] + 26);
        if (a <= 0) return null;
        const r = rowR(i);
        return (
          <div key={i} style={{position: 'absolute', left: r.x, top: ys[i], width: r.w, height: r.h, pointerEvents: 'none'}}>
            <div style={{position: 'absolute', left: 0, top: 6, bottom: 6, width: 4, borderRadius: 2, background: C.green, opacity: a, boxShadow: '0 0 12px rgba(30,215,96,0.8)'}} />
            <div style={{position: 'absolute', inset: 0, opacity: a * 0.9, background: `linear-gradient(90deg, rgba(30,215,96,0.13) 0%, rgba(30,215,96,0.03) 55%, rgba(30,215,96,0) 100%)`}} />
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${lerp(-20, 110, sweep)}%`, width: '18%', opacity: (1 - sweep) * 0.8, background: 'linear-gradient(90deg, rgba(30,215,96,0), rgba(30,215,96,0.22), rgba(30,215,96,0))'}} />
          </div>
        );
      })}
    </>
  );
};

// ── 07: timeline cascade + lifted "Check before retrying" panel ───────────────────────────────────
const Timeline: React.FC<{f: number}> = ({f}) => (
  <>
    <Fill r={{x: 296, y: 276, w: 766, h: WINDOW_RECT.h - 276}} color="rgb(15,15,14)" />
    {B07.slice(0, -1).map((y0, i) => {
      const at = T_CLICK3 + 6 + i * 4.5;
      const s = springAt(f, at, {stiffness: 200, damping: 20});
      const r = {x: 298, y: y0, w: 762, h: B07[i + 1] - y0};
      return s <= 0 ? null : <Slice key={i} id={ACT} r={r} dy={(1 - s) * 70} o={clamp(s * 1.3)} />;
    })}
  </>
);

const PanelLifted: React.FC<{f: number}> = ({f}) => {
  const s = springAt(f, T_LIFT, {stiffness: 120, damping: 14});
  if (s <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.h,
        transform: `translateZ(${320 * s}px) scale(${1 + 0.03 * s})`,
        borderRadius: 14,
        boxShadow: `0 ${30 * s}px ${80 * s}px rgba(0,0,0,${0.7 * s}), 0 0 0 1px rgba(255,255,255,0.08), 0 0 ${40 * s}px rgba(30,215,96,${0.18 * s})`,
      }}
    >
      <Crop id={ACT} rect={PANEL} scale={1} radius={14} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)'}} />
    </div>
  );
};

// ── The window and everything on it ──────────────────────────────────────────────────────────────
const WorkWindow: React.FC<{f: number; o: number}> = ({f, o}) => {
  const w = winAt(f);
  const xf14 = prog(f, T_CLICK2 + 2, T_CLICK2 + 14);
  const xf07 = prog(f, T_CLICK3 + 2, T_CLICK3 + 10);
  const lib = f < T_CLICK2 + 16;
  const office = f >= T_CLICK2 && f < T_CLICK3 + 12;
  const act = f >= T_CLICK3;
  const chipOn = ease.out(prog(f, T_CLICK1, T_CLICK1 + 6));
  const titleMask = 1 - prog(f, S2.land, S2.land + 6);
  const liftS = springAt(f, T_LIFT, {stiffness: 120, damping: 14});
  return (
    <Win
      id={act && xf07 >= 1 ? ACT : office && xf14 >= 1 ? OFFICE : LIB}
      x={w.x}
      z={w.z}
      ry={w.ry}
      rx={w.rx}
      o={o}
      lifted={act ? <div style={{opacity: o}}><PanelLifted f={f} /></div> : null}
    >
      {lib && xf14 < 1 ? (
        <>
          <LibraryTable f={f} />
          <AllChipOff o={chipOn} />
          <WorkChipOn o={chipOn} f={f} />
        </>
      ) : null}
      {office && xf14 > 0 && !(act && xf07 >= 1) ? (
        <div style={{position: 'absolute', inset: 0, opacity: xf14}}>
          <Crop id={OFFICE} rect={WINDOW_RECT} scale={1} radius={16} />
          <Fill r={{x: 300, y: 96, w: 500, h: 78}} color="rgb(15,15,15)" o={titleMask} />
        </div>
      ) : null}
      {act ? (
        <div style={{position: 'absolute', inset: 0, opacity: xf07}}>
          <Crop id={ACT} rect={WINDOW_RECT} scale={1} radius={16} />
          <Timeline f={f} />
          <Fill r={{x: PANEL.x - 2, y: PANEL.y - 2, w: PANEL.w + 4, h: PANEL.h + 4}} color="rgb(11,11,11)" radius={14} o={clamp(liftS)} />
          <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 14, boxShadow: `inset 0 0 0 1px rgba(255,255,255,${0.06 * clamp(liftS)})`}} />
          <Fill r={WINDOW_RECT} color="#000" radius={16} o={0.32 * clamp(liftS)} />
          <Highlight f={f} r={{x: 300, y: 384, w: 756, h: 68}} start={T_LIFT + 6} end={880} radius={10} width={2} />
        </div>
      ) : null}
      <Cursor
        f={f}
        path={[
          {f: 196, x: 1120, y: 780},
          {f: 232, x: 712, y: 242},
          {f: 300, x: 712, y: 242},
          {f: 416, x: 560, y: 640},
          {f: 444, x: 142, y: 822},
          {f: 660, x: 520, y: 520},
          {f: 684, x: 124, y: 246},
        ]}
        clicks={[T_CLICK1, T_CLICK2, T_CLICK3]}
        show={f < 330 ? [196, 300] : f < 560 ? [414, 474] : [658, 716]}
      />
    </Win>
  );
};

export const WorkBody: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f);
  const t = f - 960;
  const seam = t >= SEAM_START;
  const si = seam ? seamIcon(t) : null;
  const winO = seam && si ? 1 - prog(si.m, 2.4, 5.2) : 1;
  return (
    <AbsoluteFill style={{background: C.stage, overflow: 'hidden'}}>
      <Backdrop f={f + 2880} />
      {f >= 146 && winO > 0 ? (
        <AbsoluteFill>
          <Stage cam={cam} perspective={P}>
            <WorkWindow f={f} o={winO} />
          </Stage>
        </AbsoluteFill>
      ) : null}
      {f < 162 ? <WorkChapter f={f} /> : null}

      {/* S1 — left of the turned window */}
      <div style={{position: 'absolute', left: 116, top: 0, height: 1080, display: 'flex', alignItems: 'center'}}>
        <Super f={f} text="Automate the desk work." start={S1.start} end={S1.end} size={98} align="left" maxWidth={700} />
      </div>
      <OfficeTitle f={f} cam={cam} />
      {/* S3 — lower third under the Activity window */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 962, display: 'flex', justifyContent: 'center'}}>
        <Super f={f} text="Know what happened. And what's next." start={S3.start} end={S3.end} size={62} accentWords={[4, 5]} maxWidth={1800} />
      </div>

      {seam && si ? <SeamGlyph t={t} /> : null}
    </AbsoluteFill>
  );
};

// "Your private desk." — a super that flies into the Secret Office page and becomes its title.
const OfficeTitle: React.FC<{f: number; cam: Cam3}> = ({f, cam}) => {
  if (f < S2.start - 2 || f > S2.land + 12) return null;
  const SIZE = 112;
  const UI = 57.8; // UI title font size (source px), from cap height 42 px
  // landing box (source px → screen) — window is flat and at the origin by then
  const m = mag(0, cam.z);
  const lx = 960 + (309 - WC.x - cam.x) * m;
  const ly = 540 + (109 - 0.147 * UI - WC.y - cam.y) * m;
  const k = (UI * m) / SIZE;
  const p = ease.inOut(prog(f, S2.fly, S2.land));
  const x = lerp(506, lx, p);
  const y = lerp(64, ly, p);
  const sx = lerp(1, k * 0.971, p);
  const sy = lerp(1, k, p);
  const o = 1 - prog(f, S2.land, S2.land + 6);
  return (
    <div style={{position: 'absolute', left: x, top: y, transformOrigin: '0 0', transform: `scale(${sx}, ${sy})`, opacity: o, whiteSpace: 'nowrap'}}>
      <Super f={f} text="Your private desk." start={S2.start} size={SIZE} align="left" maxWidth={2000} />
    </div>
  );
};

// Vector Activity/Grow glyph that rides the camera dive (screen space).
export const SeamGlyph: React.FC<{t: number}> = ({t}) => {
  const s = seamIcon(t);
  const flash = Math.exp(-Math.abs(t) / 10) * prog(t, SEAM_START + 20, 0);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: s.x - 700,
          top: s.y - 700,
          width: 1400,
          height: 1400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(30,215,96,${0.32 * flash}) 0%, rgba(30,215,96,${0.08 * flash}) 35%, rgba(30,215,96,0) 65%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'absolute', left: s.x - s.size / 2, top: s.y - s.size / 2, width: s.size, height: s.size}}>
        <BarsIcon size={s.size} h={t < SEAM_START + 2 ? ACTIVITY_BARS : s.bars} glow={s.glow} />
      </div>
    </>
  );
};
