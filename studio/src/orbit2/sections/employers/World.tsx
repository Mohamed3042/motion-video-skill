// Station 8 · Employers (lavender) — CSS-3D layer: the in-scene title in front of the café-wall façade, the
// "Straight rows." confirmation, and the two employer dossiers that swing out of their windows as glass holograms.
// Copy is v1's claim-reviewed copy (World2D.tsx); sample employers are fictional.
import React from 'react';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {clamp, type V3} from '../../engine/math';
import {anchor, Dust, faceShot, glass, GlassFx, Holo, Row, Sample, spr, TitleBlock} from '../market/holo';
import {EXPO, EXPO_IN, lerp, pulse, rgba} from '../market/kit';
import {CARD, DOSSIERS, FACE} from './layout';
import {HERO_SHOT, shot} from './shot';
import {T} from './timing';

const A = ACCENT.employers; // #c9b6ff

// ---------------- title: a sign mounted on the façade (just proud of the ledges); the dolly sweeps it into perspective ----------------
const TITLE_SHOT = shot(34);
const TITLE_Z = 110;
const TITLE_S = 1.45; // world scale of the 1140×340 title card
const TITLE_K = (1483.6 / (TITLE_SHOT.pos[2] - TITLE_Z)) * TITLE_S; // px per content px at the opening shot
const TITLE_P = anchor(TITLE_SHOT, 112 + 570 * TITLE_K, 590 + 170 * TITLE_K, TITLE_SHOT.pos[2] - TITLE_Z);
const Title: React.FC<{f: number}> = ({f}) => {
  if (f < 2 || f > T.titleOut + 24) return null;
  const out = lerp(f, T.titleOut, T.titleOut + 20, 0, 1, EXPO_IN);
  return (
    <Card3D p={[TITLE_P[0], TITLE_P[1], TITLE_Z]} s={TITLE_S} w={1140} h={340} opacity={1 - out}>
      <div style={{position: 'absolute', left: -240, top: -190, width: 1600, height: 740, opacity: lerp(f, 2, 18), background: 'radial-gradient(closest-side, rgba(4,8,36,0.93) 0%, rgba(4,8,36,0.84) 50%, rgba(4,8,36,0) 100%)'}} />
      <TitleBlock f={f} at={4} index={8} name="EMPLOYERS" promise="Inspect employers through their sources." accent={A} size={156} />
    </Card3D>
  );
};

// ---------------- "Straight rows." after the dolly has shown it ----------------
const CAP_P = anchor(shot(112), 1180, 250, 1500);
const Straight: React.FC<{f: number}> = ({f}) => {
  const s = spr(f, T.caption, 13, 200, 0.7);
  const out = lerp(f, T.out - 8, T.out + 6, 0, 1, EXPO_IN);
  if (s <= 0.01 || out >= 1) return null;
  return (
    <Card3D p={[CAP_P[0], CAP_P[1] + 120 * out, CAP_P[2]]} billboard w={700} h={130} opacity={Math.min(1, s * 2) * (1 - out)} s={0.9 + 0.1 * s}>
      <div
        style={{
          height: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          borderRadius: 16,
          background: `linear-gradient(135deg, rgba(200,190,255,0.10), rgba(200,190,255,0) 45%), ${rgba('#070a34', 0.9)}`,
          border: `1px solid ${rgba(A, 0.6)}`,
          boxShadow: `0 0 ${40 + 80 * pulse(f, T.caption, 10)}px ${rgba(A, 0.35)}`,
        }}
      >
        {['Straight', 'rows.'].map((w, i) => (
          <span key={w} style={{fontFamily: FONT, fontWeight: 700, fontSize: 84, letterSpacing: '-0.035em', color: i === 0 ? A : C.ink, translate: `0px ${(1 - spr(f, T.caption + i * 3, 14, 200, 0.7)) * 26}px`}}>
            {w}
          </span>
        ))}
      </div>
    </Card3D>
  );
};

// ---------------- small UI pieces (sized for ≥ 22 px at 1:1) ----------------
const Ico: React.FC<{size: number; color: string; d: string}> = ({size, color, d}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flex: 'none'}}>
    <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BRIEFCASE = 'M4 8h16v11H4zM9 8V5h6v3M4 13h16';
const DOC = 'M7 3h7l4 4v14H7zM14 3v4h4M10 13h5M10 17h5';
const CHECK = 'M5.5 12.6l4.2 4.2 8.8-9.4';

const Btn: React.FC<{label: string; primary?: boolean; glow?: number; fs?: number; h?: number}> = ({label, primary, glow = 0, fs = 25, h = 56}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: h,
      padding: '0 22px',
      borderRadius: 7,
      background: primary ? C.cobalt : rgba(C.bg, 0.7),
      border: `1px solid ${primary ? rgba('#6f8cff', 0.75) : C.line}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: fs,
      color: C.ink,
      whiteSpace: 'nowrap',
      boxShadow: glow > 0.01 ? `0 0 ${36 * glow}px ${rgba(A, 0.9 * glow)}` : undefined,
    }}
  >
    {label}
  </div>
);

// ---------------- a dossier: flies out of its window (parallel to the façade, window-sized) to its reading pose ----------------
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const Dossier: React.FC<{i: number}> = ({i}) => {
  const f = useWorldFrame();
  const d = DOSSIERS[i];
  const go = spr(f, T.out + i * 6, 15, 95, 1);
  const back = spr(f, T.back + i * 4, 18, 120, 0.9);
  const t = go * (1 - back);
  if (t <= 0.002) return null;
  const from: V3 = [d.win.x, d.win.y, 12];
  const p = lerp3(from, d.rest, t);
  p[2] += Math.sin(Math.PI * clamp(t)) * 380; // pops out of the wall before it turns
  const r: V3 = [FACE[0] * t, FACE[1] * t, 0];
  const sc = 0.27 + 0.73 * t;
  const src = lerp(f, T.sources, T.sources + 24, 0, 1, EXPO);
  const watch = i === 0 ? lerp(f, T.watch, T.watch + 18, 0, 1, EXPO) : 0;
  const flashIn = pulse(f, T.out + i * 6 + 14, 12);
  return (
    <Group3D p={p} r={r} order="YXZ" s={sc}>
      <Card3D w={CARD.w} h={CARD.h} opacity={clamp(t * 3)} style={glass(A, 0.84)}>
        <GlassFx accent={A} w={CARD.w} edge="top" seed={5 + i} flash={flashIn + 0.8 * pulse(f, T.sources, 14)} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: A, opacity: 0.85}} />
        <div style={{position: 'absolute', left: 32, top: 36, width: 72, height: 72, borderRadius: 16, background: rgba(A, 0.14), border: `1px solid ${rgba(A, 0.5)}`, display: 'grid', placeItems: 'center', fontSize: 38, color: A, fontWeight: 700}}>{d.monogram}</div>
        <div style={{position: 'absolute', left: 124, top: 32, fontSize: 38, fontWeight: 600, whiteSpace: 'nowrap'}}>{d.name}</div>
        <div style={{position: 'absolute', left: 126, top: 82, fontSize: 25, color: C.muted}}>Employer dossier</div>
        <Sample style={{right: 28, top: 32}} />
        <Row at={T.out + 20 + i * 6} x={34} y={142} style={{right: 34}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, color: A, fontSize: 25}}>
            <Ico size={28} color={A} d={BRIEFCASE} /> Publicly observed needs
          </div>
          <div style={{fontSize: 34, fontWeight: 500, marginTop: 10, whiteSpace: 'nowrap'}}>{d.context}</div>
          <div style={{fontSize: 25, color: C.muted, marginTop: 6, whiteSpace: 'nowrap'}}>{d.detail}</div>
        </Row>
        <div style={{position: 'absolute', left: 34, right: 34, top: 296, height: 1, background: C.line}} />
        <Row at={T.out + 26 + i * 6} x={22} y={314} style={{right: 22}}>
          <div style={{border: `1px solid ${rgba(A, 0.18 + src * 0.55)}`, borderRadius: 9, padding: '15px 14px', background: rgba(A, 0.03 + src * 0.07), boxShadow: src > 0.01 ? `0 0 ${30 * src}px ${rgba(A, 0.25 * src)}` : undefined}}>
            <div style={{display: 'flex', gap: 12, alignItems: 'center', fontSize: 27, whiteSpace: 'nowrap'}}>
              <Ico size={30} color={A} d={DOC} /> {d.source}
            </div>
            <div style={{marginTop: 9, fontSize: 23, color: C.muted, whiteSpace: 'nowrap'}}>Captured 02 Oct 2026 · Accepted observation</div>
          </div>
        </Row>
        <Row at={T.out + 32 + i * 6} x={34} y={CARD.h - 92} style={{right: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Btn label="View sources" primary glow={src * (1 - watch) * 0.5 * pulse(f, T.sources, 40) + src * 0.12} />
          <div style={{display: 'flex', gap: 14, alignItems: 'center', fontSize: 25, color: watch > 0.5 ? A : C.muted, whiteSpace: 'nowrap'}}>
            Watch employer
            <div style={{width: 66, height: 36, padding: 4, borderRadius: 30, boxSizing: 'border-box', background: i === 0 ? rgba(A, 0.15 + 0.6 * watch) : C.raised, border: `1px solid ${rgba(A, 0.55)}`, boxShadow: watch > 0.01 ? `0 0 ${24 * pulse(f, T.watch, 16)}px ${A}` : undefined}}>
              <div style={{width: 26, height: 26, borderRadius: '50%', background: C.ink, transform: `translateX(${28 * watch}px)`}} />
            </div>
          </div>
        </Row>
      </Card3D>
    </Group3D>
  );
};

// ---------------- header + footer lines (pixel-exact at the hero pose) ----------------
const HF = faceShot(HERO_SHOT);
const at1 = (sx: number, sy: number, w: number, h: number) => anchor(HERO_SHOT, sx + w / 2, sy + h / 2);
const Floating: React.FC<{x: number; y: number; w: number; h: number; at: number; out: number; children: React.ReactNode}> = ({x, y, w, h, at, out, children}) => {
  const f = useWorldFrame();
  const s = spr(f, at, 16, 130, 0.8);
  const o = lerp(f, out, out + 18, 0, 1, EXPO_IN);
  if (s <= 0.003 || o >= 1) return null;
  const p = at1(x, y, w, h);
  return (
    <Group3D p={[p[0], p[1] - (1 - s) * 50, p[2]]} r={HF} order="YXZ">
      <Card3D w={w} h={h} opacity={clamp(s * 2) * (1 - o)}>
        {children}
      </Card3D>
    </Group3D>
  );
};

const Header: React.FC = () => (
  <Floating x={110} y={124} w={1700} h={70} at={T.out - 4} out={T.back}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 70, fontFamily: FONT, color: C.ink}}>
      <div style={{fontWeight: 600, fontSize: 40, textShadow: '0 2px 18px rgba(4,8,36,0.95)'}}>Look beyond the job title.</div>
      <div style={{display: 'inline-flex', alignItems: 'center', height: 48, padding: '0 20px', borderRadius: 999, border: `1px solid ${rgba(A, 0.75)}`, background: rgba('#070a34', 0.75), color: A, fontWeight: 600, fontSize: 25}}>Source-linked dossiers</div>
    </div>
  </Floating>
);

const Footer: React.FC = () => {
  const f = useWorldFrame();
  const watch = lerp(f, T.watch, T.watch + 18, 0, 1, EXPO);
  return (
    <>
      <Holo p={at1(110, 800, 1700, 150)} r={HF} w={1700} h={150} accent={A} at={T.out + 22} out={T.back + 4} seed={7} edge="top" flash={pulse(f, T.sources, 14)} alpha={0.82}>
        <Row at={T.sources} x={32} y={26}>
          <div style={{display: 'flex', gap: 14, alignItems: 'center', fontFamily: FONT, fontSize: 28, color: C.ink, whiteSpace: 'nowrap'}}>
            <Ico size={30} color={A} d={CHECK} /> Needs come from accepted public observations.
          </div>
        </Row>
        <Row at={T.out + 30} x={34} y={90}>
          <div style={{fontFamily: MONO, fontSize: 22, color: C.muted, whiteSpace: 'nowrap'}}>Employer context does not establish an open vacancy.</div>
        </Row>
      </Holo>
      <Holo p={anchor(HERO_SHOT, 1352 + 215, 838 + 38, 1476)} r={HF} w={430} h={76} accent={A} at={T.watch - 2} out={T.back + 2} seed={9} edge="left" flash={pulse(f, T.watch, 14)} alpha={0.9}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: FONT, fontWeight: 600, fontSize: 26, whiteSpace: 'nowrap', textShadow: `0 0 ${20 * watch}px ${rgba(A, 0.6)}`}}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill={A}>
            <path d="M10 2.5l1.9 5.6 5.6 1.9-5.6 1.9L10 17.5l-1.9-5.6L2.5 10l5.6-1.9z" />
          </svg>
          Find unexpected opportunities
        </div>
      </Holo>
    </>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <>
      <Dust seed={81} n={60} min={[-2600, -900, 300]} max={[1600, 900, 2600]} accent={A} drift={[0.35, 0.1, 0.25]} size={[5, 18]} />
      <Title f={f} />
      <Straight f={f} />
      <Dossier i={1} />
      <Dossier i={0} />
      <Header />
      <Footer />
    </>
  );
};
