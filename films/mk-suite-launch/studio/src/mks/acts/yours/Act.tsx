// Act 5 · Make it yours (global 4800–6000): the monetization moment, told with the real Membership UI.
// Membership (08) → Review your selection (09) → Settings (11) ⟶ Light theme (31) → Guide (12) ⟶ the Welcome (13)
// that opens the finale (one continuous camera move across the 6000 seam, see ../finale/scene.tsx).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../../brand';
import {useActFrame} from '../../frame';
import {At, Backdrop, Crop, Highlight, Screen, Stage, ease, kf, lerp, prog, springAt, type Rect} from '../../kit';
import {GuideWelcome} from '../finale/scene';
import {Bloom, BoxTick, Defocus, Lines, MoBlur, Patch, PinCursor, camAt, wx, wy} from './parts';
import {T} from './timing';

// ── Measured rects (1× source px) ──────────────────────────────────────────────────────────────
const M8 = '08-membership' as const;
const R8 = {
  tabOff: {x: 714, y: 218, w: 414, h: 59}, // the selected "Build a bundle" pill (incl. its glow)
  tabLabel: {x: 835, y: 229, w: 176, h: 38}, // its icon + label
  tabPill: {x: 716, y: 219, w: 410, h: 57},
  tabs: [
    {x: 305, y: 222, w: 409, h: 51}, // Single app
    {x: 718, y: 222, w: 406, h: 51}, // Build a bundle
    {x: 1128, y: 222, w: 428, h: 51}, // All Access
  ],
  boxes: [
    {x: 342, y: 389, w: 29, h: 29}, // MK Voice
    {x: 342, y: 484, w: 29, h: 29}, // MK Editor
    {x: 342, y: 578, w: 29, h: 29}, // Montage Pro
  ],
  boxOff: {x: 338, y: 689, w: 36, h: 36}, // Reclaim's unticked checkbox (+4 px), pasted over the ticked ones
  rows: [
    {x: 323, y: 361, w: 667, h: 85},
    {x: 323, y: 456, w: 667, h: 85},
    {x: 323, y: 550, w: 667, h: 85},
  ],
  count: {x: 1059, y: 406, w: 88, h: 34}, // "3 apps"
  cfg: {x: 1046, y: 322, w: 494, h: 256}, // Creator bundle · 3 apps · Term length
  cube: {x: 1468, y: 398},
  estimate: {x: 1032, y: 592, w: 526, h: 266}, // Estimated total / Review estimate / pricing note → defocused
  badge: {x: 797, y: 108, w: 333, h: 48}, // "Pricing preview · checkout unavailable" → defocused
};
const D9 = '09-membership-dialogs' as const;
const DR: Rect = {x: 506, y: 162, w: 810, h: 723}; // the Review your selection dialog
const DO = {x: DR.x, y: DR.y};
const R9 = {
  rows: [
    {x: 529, y: 293, w: 566, h: 110}, // thumbnail + name + Term (stops at the Pricing divider)
    {x: 529, y: 414, w: 566, h: 109},
    {x: 529, y: 535, w: 566, h: 110},
  ],
  subtitle: {x: 538, y: 244, w: 300, h: 32},
  pricing: {x: 1095, y: 292, w: 198, h: 354},
  bottom: {x: 518, y: 660, w: 788, h: 216},
};
const SR: Rect = {x: 288, y: 76, w: 884, h: 860}; // Settings main column (identical crop on 11 and 31; ends at y 936)
const SO = {x: SR.x, y: SR.y};
const LIGHT = {x: 897 - SR.x, y: 380 - SR.y}; // centre of the "Light" theme thumbnail in 11

const rr = (r: Rect, o: {x: number; y: number}): Rect => ({x: r.x - o.x, y: r.y - o.y, w: r.w, h: r.h});

// ── Membership + dialog ────────────────────────────────────────────────────────────────────────
const mLx = (f: number) =>
  kf(f, [
    [-12, -380],
    [84, -470, ease.expoOut],
    [150, -480],
    [208, wx(930)],
    [330, wx(946)],
    [395, -560],
    [482, -575],
    [526, 0],
  ]);
const mLy = (f: number) =>
  kf(f, [
    [-12, -40],
    [84, 0, ease.expoOut],
    [150, 4],
    [208, wy(540)],
    [330, wy(548)],
    [395, 6],
    [482, 8],
    [526, 0],
  ]);
const mS = (f: number) =>
  kf(f, [
    [-12, 0.3],
    [84, 0.7, ease.expoOut],
    [150, 0.735],
    [208, 1.45],
    [330, 1.48],
    [395, 0.74],
    [482, 0.765],
    [526, 0.6],
  ]);
const mRy = (f: number) => kf(f, [[-12, 34], [84, 17, ease.expoOut], [150, 13], [208, 0], [330, 0], [395, 17], [482, 13], [526, 0]]);
const mRx = (f: number) => kf(f, [[-12, 12], [84, 3, ease.expoOut], [150, 2], [208, 0], [330, 0], [395, 2], [482, 1], [526, 0]]);

const Count: React.FC<{f: number}> = ({f}) => {
  const [t1, t2, t3] = T.ticks;
  if (f >= t3 + 30) return null;
  const n = f < t1 ? 0 : f < t2 ? 1 : f < t3 ? 2 : 3;
  const at = n === 1 ? t1 : n === 2 ? t2 : t3;
  const s = springAt(f, at, {stiffness: 260, damping: 18});
  const r = R8.count;
  return (
    <>
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: 'rgb(16,16,15)'}} />
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden'}}>
        {n === 3 ? (
          <div style={{position: 'absolute', left: 0, top: 10 * (1 - s), opacity: Math.min(1, s * 1.5)}}>
            <Crop id={M8} rect={r} scale={1} />
          </div>
        ) : n > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: 1062.5 - r.x,
              top: 408.6 - r.y + 10 * (1 - s),
              opacity: Math.min(1, s * 1.5),
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: 26,
              lineHeight: '26px',
              color: 'rgb(196,201,218)',
              whiteSpace: 'nowrap',
            }}
          >
            {n === 1 ? '1 app' : '2 apps'}
          </div>
        ) : null}
      </div>
    </>
  );
};

const MembershipOverlays: React.FC<{f: number}> = ({f}) => {
  const tabOff = 1 - prog(f, T.clickTab, T.clickTab + 6);
  const tabGlow = kf(f, [[T.clickTab, 0], [T.clickTab + 4, 1], [T.clickTab + 44, 0]]);
  const cfgDim = 1 - prog(f, T.ticks[0], T.ticks[0] + 10);
  const pulse = kf(f, [[T.pulse, 0], [T.pulse + 7, 1.35], [T.pulse + 60, 0.4], [T.pulse + 150, 0]]);
  const p = R8.tabPill;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16}}>
      <Defocus id={M8} r={R8.estimate} blur={6} dim={0.3} sat={0.35} radius={12} />
      <Defocus id={M8} r={R8.badge} blur={3} dim={0.38} sat={0.35} radius={10} />
      {/* before the click: "Build a bundle" drawn unselected (flat segment + greyed label) */}
      {tabOff > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: R8.tabOff.x,
            top: R8.tabOff.y,
            width: R8.tabOff.w,
            height: R8.tabOff.h,
            opacity: tabOff,
            background:
              'linear-gradient(180deg, rgb(15,15,15) 0px, rgb(15,15,15) 2px, rgb(32,32,33) 2px, rgb(30,30,31) 4px, rgb(20,20,20) 4px, rgb(20,20,20) 56px, rgb(30,30,31) 56px, rgb(28,28,29) 58px, rgb(14,14,14) 58px)',
          }}
        >
          <div style={{position: 'absolute', left: R8.tabLabel.x - R8.tabOff.x, top: R8.tabLabel.y - R8.tabOff.y, filter: 'grayscale(1) brightness(0.86) contrast(1.15)', mixBlendMode: 'lighten'}}>
            <Crop id={M8} rect={R8.tabLabel} scale={1} />
          </div>
        </div>
      ) : null}
      {tabGlow > 0 ? (
        <div style={{position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h, borderRadius: 8, boxShadow: `0 0 ${36 * tabGlow}px rgba(30,215,96,${0.7 * tabGlow}), inset 0 0 ${24 * tabGlow}px rgba(30,215,96,${0.35 * tabGlow})`}} />
      ) : null}
      {/* checkboxes: unticked until the cursor ticks them on the beat */}
      {R8.boxes.map((b, i) =>
        f < T.ticks[i] ? (
          <div key={i} style={{position: 'absolute', left: b.x - 4, top: b.y - 4}}>
            <Crop id={M8} rect={R8.boxOff} scale={1} />
          </div>
        ) : (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: b.x - 4, top: b.y - 4, opacity: 1 - prog(f, T.ticks[i], T.ticks[i] + 3)}}>
              <Crop id={M8} rect={R8.boxOff} scale={1} />
            </div>
            {f < T.ticks[i] + 40 ? <div style={{position: 'absolute', left: b.x - 1, top: b.y - 1, width: b.w + 2, height: b.h + 2, background: 'rgb(18,18,17)', borderRadius: 5}} /> : null}
            {f < T.ticks[i] + 40 ? <BoxTick f={f} at={T.ticks[i]} r={b} /> : null}
            <Highlight f={f} r={R8.rows[i]} start={T.ticks[i]} end={T.ticks[i] + 26} radius={12} width={2.5} />
          </React.Fragment>
        ),
      )}
      {/* the configuration panel wakes with the first pick, counts the apps, then pulses */}
      {cfgDim > 0 ? <div style={{position: 'absolute', left: R8.cfg.x, top: R8.cfg.y, width: R8.cfg.w, height: R8.cfg.h, borderRadius: 10, background: `rgba(12,12,12,${0.66 * cfgDim})`}} /> : null}
      <Count f={f} />
      <Bloom x={R8.cube.x} y={R8.cube.y} r={210} o={pulse} />
      <Highlight f={f} r={R8.cfg} start={T.pulse} end={T.super2[0] + 6} radius={14} width={3} />
      {/* "One app. A bundle. Or everything." ↔ Single app · Build a bundle · All Access */}
      {R8.tabs.map((t, i) => (
        <Highlight key={i} f={f} r={t} start={T.super2[i]} end={i < 2 ? T.super2[i + 1] : 488} radius={9} width={4.5} />
      ))}
      <PinCursor
        f={f}
        scale={0.82}
        show={[166, 338]}
        clicks={[T.clickTab, ...T.ticks]}
        path={[
          {f: 166, x: 1200, y: 600},
          {f: T.clickTab - 7, x: 926, y: 251},
          {f: T.clickTab + 3, x: 926, y: 251},
          {f: T.ticks[0] - 5, x: 358, y: 405},
          {f: T.ticks[0] + 5, x: 358, y: 405},
          {f: T.ticks[1] - 5, x: 358, y: 499},
          {f: T.ticks[1] + 5, x: 358, y: 499},
          {f: T.ticks[2] - 5, x: 358, y: 593},
          {f: T.ticks[2] + 6, x: 358, y: 593},
          {f: 336, x: 560, y: 780},
        ]}
      />
    </div>
  );
};

const DialogOverlays: React.FC<{f: number}> = ({f}) => (
  <>
    <Defocus id={D9} r={R9.subtitle} o={DO} blur={4} dim={0.5} radius={6} />
    <Defocus id={D9} r={R9.pricing} o={DO} blur={6} dim={0.38} radius={10} />
    <Defocus id={D9} r={R9.bottom} o={DO} blur={5} dim={0.42} radius={10} />
    {R9.rows.map((r, i) => (
      <Highlight key={i} f={f} r={rr(r, DO)} start={T.rows[i]} end={T.whipA - 26} radius={14} width={3} />
    ))}
  </>
);

const SceneMembership: React.FC<{f: number}> = ({f}) => {
  const ox = (t: number) => -2700 * ease.in(prog(t, T.whipA - 24, T.whipA + 4));
  const bx = Math.min(70, Math.abs(ox(f) - ox(f - 1)) * 0.3);
  const dim = kf(f, [[488, 0], [526, 0.62]]);
  // dialog: springs in, then the camera pushes onto the three rows
  const sp = springAt(f, T.dialog - 8, {stiffness: 150, damping: 16});
  const push = ease.inOut(prog(f, 530, 568));
  const ds = lerp(1.08, 1.4, push) * (0.82 + 0.18 * sp);
  const fx = lerp(DR.w / 2, 300, push);
  const fy = lerp(DR.h / 2, 330, push);
  return (
    <MoBlur id="y-mb-a" bx={bx} style={{transform: `translateX(${ox(f)}px)`}}>
      <Stage cam={camAt(mLx(f), mLy(f), mS(f))}>
        <At ry={mRy(f)} rx={mRx(f)}>
          <Screen id={M8} width={1586}>
            <MembershipOverlays f={f} />
            {dim > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: 16, background: `rgba(4,5,6,${dim})`}} /> : null}
          </Screen>
        </At>
      </Stage>
      {f >= T.dialog - 8 ? (
        <div style={{position: 'absolute', left: 960 - fx * ds, top: 540 - fy * ds, transformOrigin: '0 0', transform: `scale(${ds})`, opacity: Math.min(1, sp * 1.8)}}>
          <Screen id={D9} rect={DR} width={DR.w} radius={12} rim={0.5}>
            <DialogOverlays f={f} />
          </Screen>
        </div>
      ) : null}
      {/* supers: left of the window, never over it */}
      <div style={{position: 'absolute', left: 118, top: 0, height: 1080, display: 'flex', alignItems: 'center'}}>
        <Lines
          f={f}
          size={104}
          end={140}
          lines={[
            {text: 'Make it', start: T.super1},
            {text: 'your suite.', start: T.super1 + 8, accent: [1]},
          ]}
        />
      </div>
      <div style={{position: 'absolute', left: 118, top: 0, height: 1080, display: 'flex', alignItems: 'center'}}>
        <Lines
          f={f}
          size={82}
          end={482}
          gap={6}
          lines={[
            {text: 'One app.', start: T.super2[0]},
            {text: 'A bundle.', start: T.super2[1]},
            {text: 'Or everything.', start: T.super2[2], accent: [1]},
          ]}
        />
      </div>
    </MoBlur>
  );
};

// ── Settings → Light theme ─────────────────────────────────────────────────────────────────────
const SceneSettings: React.FC<{f: number}> = ({f}) => {
  const ox = (t: number) => 2700 * (1 - ease.expoOut(prog(t, T.whipA - 4, T.whipA + 42)));
  const oy = (t: number) => -1400 * ease.in(prog(t, T.whipB - 24, T.whipB + 2));
  const bx = Math.min(70, Math.abs(ox(f) - ox(f - 1)) * 0.3);
  const by = Math.min(70, Math.abs(oy(f) - oy(f - 1)) * 0.3);
  const s = kf(f, [[T.whipA, 1.0], [940, 1.06, ease.linear]]);
  const ry = kf(f, [[T.whipA, 12], [940, 5, ease.linear]]);
  const r = kf(f, [[T.clickLight + 2, 0], [T.clickLight + 56, 880, ease.inOut]]);
  const ring = 1 - prog(r, 560, 880);
  return (
    <MoBlur id="y-mb-s" bx={bx} by={by} style={{transform: `translate(${ox(f)}px, ${oy(f)}px)`}}>
      <Stage cam={camAt(410 / s, 0, s)}>
        <At ry={ry}>
          <Screen id="11-settings" rect={SR} width={SR.w}>
            {r > 0 ? (
              <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16}}>
                <div style={{position: 'absolute', inset: 0, clipPath: `circle(${r}px at ${LIGHT.x}px ${LIGHT.y}px)`}}>
                  <Crop id="31-light-theme" rect={SR} scale={1} />
                  {/* 31's browser-catalog card starts at x 1145: paint its sliver with the page colour */}
                  <div style={{position: 'absolute', left: 1142 - SR.x, top: 0, width: SR.x + SR.w - 1142, height: SR.h, background: 'rgb(246,247,245)'}} />
                </div>
                {ring > 0 ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: LIGHT.x - r,
                      top: LIGHT.y - r,
                      width: 2 * r,
                      height: 2 * r,
                      borderRadius: '50%',
                      border: `3px solid rgba(255,255,255,${0.9 * ring})`,
                      boxShadow: `0 0 34px rgba(30,215,96,${0.8 * ring}), inset 0 0 26px rgba(30,215,96,${0.45 * ring})`,
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            <PinCursor
              f={f}
              scale={0.95}
              show={[742, 806]}
              clicks={[T.clickLight]}
              path={[
                {f: 742, x: 830, y: 660},
                {f: T.clickLight - 6, x: LIGHT.x + 4, y: LIGHT.y + 6},
                {f: 806, x: LIGHT.x + 4, y: LIGHT.y + 6},
              ]}
            />
          </Screen>
        </At>
      </Stage>
      <div style={{position: 'absolute', left: 1236, top: 0, height: 1080, display: 'flex', alignItems: 'center'}}>
        <Lines
          f={f}
          size={136}
          end={912}
          gap={4}
          lines={[
            {text: 'Dark.', start: T.dark},
            {text: 'Light.', start: T.clickLight},
            {text: 'Yours.', start: T.yours, accent: [0]},
          ]}
        />
      </div>
    </MoBlur>
  );
};

// ── Guide → (seam) → Welcome ───────────────────────────────────────────────────────────────────
const SceneGuide: React.FC<{f: number}> = ({f}) => {
  const oy = (t: number) => 1300 * (1 - ease.expoOut(prog(t, T.whipB - 6, T.whipB + 44)));
  const by = Math.min(70, Math.abs(oy(f) - oy(f - 1)) * 0.3);
  return (
    <MoBlur id="y-mb-g" by={by} style={{transform: `translateY(${oy(f)}px)`}}>
      <GuideWelcome g={f - 1200} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 92, display: 'flex', justifyContent: 'center'}}>
        <Lines f={f} size={88} end={1100} align="center" lines={[{text: 'Answers, built in.', start: T.answers, accent: [2]}]} />
      </div>
    </MoBlur>
  );
};

export const Act: React.FC = () => {
  const f = useActFrame();
  return (
    <AbsoluteFill style={{background: C.stage}}>
      <Backdrop f={f + 4800} />
      {f < T.whipA + 6 ? <SceneMembership f={f} /> : null}
      {f >= T.whipA - 6 && f < T.whipB + 4 ? <SceneSettings f={f} /> : null}
      {f >= T.whipB - 8 ? <SceneGuide f={f} /> : null}
    </AbsoluteFill>
  );
};
