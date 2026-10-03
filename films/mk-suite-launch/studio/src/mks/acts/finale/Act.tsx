// Act 6 · Finale (global 6000–7200): Welcome (13) cubes → match cut → Website entry (21) Create/Work/Grow
// → the MK SUITE mark locks with a green bloom → slow fade to black (black by local 1196).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, PRODUCT_HUE} from '../../brand';
import {useActFrame} from '../../frame';
import {At, Backdrop, Screen, Stage, Super, ease, kf, prog, springAt} from '../../kit';
import {Bloom, camAt, wx, wy} from '../yours/parts';
import {GuideWelcome} from './scene';
import {mulberry32} from '../../timing';
import {T} from './timing';

// ── Website entry (21) ─────────────────────────────────────────────────────────────────────────
const W21 = '21-website-entry' as const;
const CARD = {x: 797, y: 275}; // centre of the hero MK Voice glass card (matches Welcome's MK Voice cube)
const COLS = [
  {r: {x: 40, y: 507, w: 500, h: 328}, icon: {x: 89, y: 546}}, // Create
  {r: {x: 545, y: 507, w: 499, h: 328}, icon: {x: 604, y: 549}}, // Work
  {r: {x: 1049, y: 507, w: 500, h: 328}, icon: {x: 1104, y: 548}}, // Grow
];
const M0 = T.match - 14; // web scene starts (crossfade 346 → 364)

const Columns: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16}}>
    {COLS.map((c, i) => {
      const hit = T.cols[i];
      const lit = prog(f, hit, hit + 5);
      const flash = f >= hit ? 1 - prog(f, hit, hit + 45) : 0;
      const dim = prog(f, 494, 516) * (1 - lit) * 0.55;
      const line = ease.expoOut(prog(f, hit, hit + 20));
      return (
        <React.Fragment key={i}>
          {dim > 0 ? <div style={{position: 'absolute', left: c.r.x, top: c.r.y + 2, width: c.r.w, height: c.r.h, background: `rgba(6,7,8,${dim})`}} /> : null}
          {lit > 0 ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: c.r.x,
                  top: c.r.y,
                  width: c.r.w,
                  height: c.r.h,
                  opacity: lit * (0.55 + 0.6 * flash),
                  background: 'linear-gradient(180deg, rgba(30,215,96,0.24) 0%, rgba(30,215,96,0.08) 45%, rgba(30,215,96,0) 85%)',
                  mixBlendMode: 'screen',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: c.r.x + 12,
                  top: c.r.y - 1,
                  width: c.r.w - 24,
                  height: 3,
                  transform: `scaleX(${line})`,
                  background: C.green,
                  opacity: 0.65 + 0.35 * flash,
                  boxShadow: `0 0 ${14 + 26 * flash}px rgba(30,215,96,0.9)`,
                  borderRadius: 2,
                }}
              />
              <Bloom x={c.icon.x} y={c.icon.y} r={110} o={0.35 + 1.1 * flash} />
            </>
          ) : null}
        </React.Fragment>
      );
    })}
  </div>
);

const zs = (f: number) => kf(f, [[M0, 1.5], [T.match, 1.75, ease.in], [450, 1.0, ease.expoOut], [520, 1.04], [612, 1.2], [706, 0.42, ease.in]]);

const SceneWeb: React.FC<{f: number}> = ({f}) => {
  // pushes in with Welcome's camera through the dissolve (card ≈ cube size on screen), then pulls back to reveal
  const lx = kf(f, [[T.match, wx(CARD.x)], [450, 0, ease.expoOut]]);
  const ly = kf(f, [[T.match, wy(CARD.y)], [450, 0, ease.expoOut], [520, 10], [612, wy(640)], [706, -260, ease.in]]);
  const s = zs(f);
  const rx = kf(f, [[640, 0], [706, 20, ease.in]]);
  const o = Math.min(prog(f, T.match - 10, T.match), 1 - prog(f, 676, 708));
  const zoom = (t: number) => Math.log(zs(t));
  const blur = Math.min(5, Math.abs(zoom(f) - zoom(f - 1)) * 120);
  return (
    <AbsoluteFill style={{opacity: o, filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <Stage cam={camAt(lx, ly, s, 0, rx)}>
        <At>
          <Screen id={W21} width={1586}>
            <Columns f={f} />
          </Screen>
        </At>
      </Stage>
    </AbsoluteFill>
  );
};

// ── End card ───────────────────────────────────────────────────────────────────────────────────
const SQ = 168; // mark square (px)
const WORD_W = 569; // measured: "MK SUITE" at 116 px Inter 700 (510 px at 104)
const GAP = 48;

const Mark: React.FC<{f: number}> = ({f}) => {
  const draw = ease.in(prog(f, 688, T.lock - 2));
  const lock = springAt(f, T.lock, {stiffness: 230, damping: 15});
  const pre = f < T.lock;
  const scale = pre ? 1.16 : 1.16 - 0.16 * lock;
  const letters = pre ? 0 : Math.min(1, lock * 1.6);
  const per = 4 * (SQ - 7.5);
  const slide = ease.expoOut(prog(f, T.lock + 8, T.lock + 58));
  const shift = ((GAP + WORD_W) / 2) * (1 - slide);
  const ring = prog(f, T.lock, T.lock + 40);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: GAP, transform: `translateX(${shift}px)`}}>
      <div style={{position: 'relative', width: SQ, height: SQ, transform: `scale(${scale})`}}>
        {f >= T.lock && ring < 1 ? (
          <div
            style={{
              position: 'absolute',
              inset: -70 * ease.out(ring),
              borderRadius: 8 + 40 * ring,
              border: `${3 * (1 - ring)}px solid rgba(30,215,96,${1 - ring})`,
              boxShadow: `0 0 30px rgba(30,215,96,${0.7 * (1 - ring)})`,
            }}
          />
        ) : null}
        <svg width={SQ} height={SQ} viewBox={`0 0 ${SQ} ${SQ}`} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 ${pre ? 6 : 18 * (1 - ring) + 6}px rgba(30,215,96,${pre ? 0.4 : 0.8}))`}}>
          <path
            d={`M3.75 3.75 H${SQ - 3.75} V${SQ - 3.75} H3.75 Z`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={7.5}
            strokeLinejoin="miter"
            strokeDasharray={per}
            strokeDashoffset={per * (1 - draw)}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: -6.5,
            color: '#FFFFFF',
            opacity: letters,
            transform: `scale(${0.7 + 0.3 * letters})`,
            paddingRight: 4,
          }}
        >
          MK
        </div>
      </div>
      <div style={{clipPath: `inset(-20px ${100 * (1 - slide)}% -20px 0)`, transform: `translateX(${-36 * (1 - slide)}px)`}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 116, letterSpacing: 2, color: '#FFFFFF', lineHeight: 1, whiteSpace: 'nowrap'}}>MK SUITE</div>
      </div>
    </div>
  );
};

// Faint product-colour light orbs drifting behind the mark (seeded) — the suite's products, out of focus.
const ORBS = (() => {
  const r = mulberry32(6006);
  return Object.values(PRODUCT_HUE).slice(0, 10).map((c) => ({c, x: 140 + r() * 1640, y: 90 + r() * 900, rad: 70 + r() * 120, sp: 0.15 + r() * 0.3, ph: r() * 6.28, o: 0.07 + r() * 0.07}));
})();

const EndCard: React.FC<{f: number}> = ({f}) => {
  const amb = kf(f, [[T.lock - 30, 0], [T.lock + 4, 1.25], [T.lock + 90, 0.62], [1100, 0.5]]); // wide, soft ambience
  const core = f >= T.lock - 2 ? kf(f, [[T.lock - 2, 0], [T.lock + 2, 1], [T.lock + 46, 0]]) : 0; // the lock flash
  const streak = f >= T.lock ? 1 - prog(f, T.lock, T.lock + 50) : 0;
  const push = 1 + 0.035 * ease.inOut(prog(f, T.lock, 1200));
  const small = ease.out(prog(f, T.small, T.small + 30));
  return (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      {ORBS.map((b, i) => {
        const t = f - T.lock;
        const o = b.o * ease.out(prog(f, T.lock, T.lock + 90));
        return o > 0.002 ? (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x + 30 * Math.sin(t * 0.006 + b.ph) - b.rad,
              top: b.y - t * b.sp * 0.35 - b.rad,
              width: 2 * b.rad,
              height: 2 * b.rad,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${b.c} 0%, rgba(0,0,0,0) 100%)`,
              opacity: o,
              mixBlendMode: 'screen',
            }}
          />
        ) : null;
      })}
      <div style={{position: 'absolute', left: 60, top: 430 - 640, width: 1800, height: 1280, borderRadius: '50%', mixBlendMode: 'screen', background: `radial-gradient(closest-side, rgba(30,215,96,${0.2 * amb}) 0%, rgba(30,215,96,${0.1 * amb}) 35%, rgba(30,215,96,${0.035 * amb}) 65%, rgba(30,215,96,0) 100%)`}} />
      {core > 0 ? <div style={{position: 'absolute', left: 960 - 330, top: 430 - 330, width: 660, height: 660, borderRadius: '50%', mixBlendMode: 'screen', background: `radial-gradient(closest-side, rgba(200,255,220,${0.55 * core}) 0%, rgba(30,215,96,${0.4 * core}) 30%, rgba(30,215,96,0) 100%)`}} /> : null}
      {streak > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 960 - 900,
            top: 430 - 6,
            width: 1800,
            height: 12,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, rgba(220,255,232,${0.9 * streak}) 0%, rgba(30,215,96,${0.5 * streak}) 35%, rgba(30,215,96,0) 70%)`,
            transform: `scaleX(${0.6 + 0.5 * (1 - streak)})`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 430 - SQ / 2, height: SQ, display: 'flex', justifyContent: 'center'}}>
        <Mark f={f} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 572, display: 'flex', justifyContent: 'center'}}>
        <Super f={f} text="Your tools. One place." start={T.tagline} size={66} weight={800} stagger={5} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 668, display: 'flex', justifyContent: 'center'}}>
        <Super f={f} text="Create · Work · Grow" start={T.cww} size={36} weight={500} color={C.sub} stagger={6} accentWords={[1, 3]} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 948,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: 0.2,
          color: '#8E9290',
          opacity: small,
          transform: `translateY(${10 * (1 - small)}px)`,
        }}
      >
        The new MK Suite · coming in the next update
      </div>
    </AbsoluteFill>
  );
};

export const Act: React.FC = () => {
  const f = useActFrame();
  const gwO = 1 - prog(f, T.match - 6, T.match + 4);
  const flash = kf(f, [[T.match - 6, 0], [T.match - 1, 0.07], [T.match + 10, 0]]);
  const black = ease.inOut(prog(f, T.fadeStart, T.black));
  return (
    <AbsoluteFill style={{background: C.stage}}>
      <Backdrop f={f + 6000} glow={1 - prog(f, 640, 720) * 0.5} />
      {gwO > 0 ? (
        <AbsoluteFill style={{opacity: gwO, filter: f > T.match - 22 ? `blur(${(2.5 * prog(f, T.match - 22, T.match)).toFixed(2)}px)` : undefined}}>
          <GuideWelcome g={f} />
        </AbsoluteFill>
      ) : null}
      {f >= M0 && f < 712 ? <SceneWeb f={f} /> : null}
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(225,255,236,${flash})`, mixBlendMode: 'screen'}} /> : null}
      {f >= 684 ? <EndCard f={f} /> : null}
      {black > 0 ? <AbsoluteFill style={{background: '#000', opacity: black}} /> : null}
    </AbsoluteFill>
  );
};

