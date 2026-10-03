// Station 7 · My market (periwinkle) — CSS-3D layer: the in-scene title over the data city, the SAME GAP gauges,
// "Straight comparisons.", the matrix labels standing in the street, and the glass holograms (matrix header,
// capability demand, salary evidence, what changed). Copy is v1's claim-reviewed copy (World2D.tsx).
import React from 'react';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {type V3} from '../../engine/math';
import {anchor, Dust, faceShot, Holo, Row, Sample, spr, TitleBlock} from './holo';
import {EXPO, EXPO_IN, IconCheck, lerp, pulse, rgba} from './kit';
import {CAPS, COLX, COUNTRIES, CW, NEW_CELL, PAIR, rowZ, S} from './geom';
import {rig, shot} from './shot';
import {T} from './timing';

const A = ACCENT.market; // #6f8cff
const D2R = Math.PI / 180;

// ---------------- title: a hologram floating flat over the city, square to the rolled top-down camera ----------------
const TITLE_H = 1480;
const titlePose = () => {
  const {R, roll, T: tg} = rig(46);
  const k = (R + tg[1] - TITLE_H) / 1483.6; // world units per px at the title's height
  const [dx, dy] = [-380 * k, 24 * k];
  const c = Math.cos(roll * D2R);
  const s = Math.sin(roll * D2R);
  const p: V3 = [tg[0] + dx * c - dy * s, TITLE_H, tg[2] - dx * s - dy * c];
  return {p, roll};
};
const TITLE = titlePose();

const Title: React.FC<{f: number}> = ({f}) => {
  if (f < 12 || f > T.titleOut + 40) return null;
  const lift = lerp(f, T.titleOut, T.titleOut + 34, 0, 1, EXPO_IN);
  return (
    <Group3D p={[TITLE.p[0], TITLE.p[1] + 1500 * lift, TITLE.p[2]]} r={[-90, TITLE.roll, 0]} order="YXZ">
      <Card3D w={1140} h={340} nearFade={700} opacity={1 - lift * 0.4}>
        <div style={{position: 'absolute', left: -260, top: -200, width: 1600, height: 760, opacity: lerp(f, 10, 26), background: 'radial-gradient(closest-side, rgba(4,9,38,0.94) 0%, rgba(4,9,38,0.86) 52%, rgba(4,9,38,0) 100%)'}} />
        <TitleBlock f={f} at={12} index={7} name="MY MARKET" promise="See the market you're in." accent={A} size={164} />
      </Card3D>
    </Group3D>
  );
};

// ---------------- SAME GAP gauges, lying on the street between the coral pair ----------------
const GAP_Z = ((PAIR[0] + PAIR[1]) / 2) * S;
const Gauges: React.FC<{f: number}> = ({f}) => {
  const on = spr(f, T.gauge, 15, 180, 0.7) * (1 - lerp(f, 196, 212, 0, 1, EXPO_IN));
  if (on <= 0.01) return null;
  const h = (S - 16) * on;
  return (
    <>
      {[-900, 900].map((x) => (
        <Card3D key={x} p={[x, 6, GAP_Z]} r={[-90, 0, 0]} w={70} h={S} opacity={Math.min(1, on * 1.4)}>
          <svg width={70} height={S} viewBox={`0 0 70 ${S}`} style={{overflow: 'visible'}}>
            <g stroke="#ffffff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d={`M35 ${S / 2 - h / 2}V${S / 2 + h / 2}`} />
              <path d={`M22 ${S / 2 - h / 2 + 14}L35 ${S / 2 - h / 2}L48 ${S / 2 - h / 2 + 14}`} />
              <path d={`M22 ${S / 2 + h / 2 - 14}L35 ${S / 2 + h / 2}L48 ${S / 2 + h / 2 - 14}`} />
              <path d={`M20 ${S / 2 - 6}H50M20 ${S / 2 + 6}H50`} />
            </g>
          </svg>
        </Card3D>
      ))}
    </>
  );
};

const SameGap: React.FC<{f: number}> = ({f}) => {
  const s = spr(f, T.gauge + 4, 14, 190, 0.7);
  const out = lerp(f, 194, 208, 0, 1, EXPO_IN);
  if (s <= 0.01 || out >= 1) return null;
  return (
    <Card3D p={[0, 40, GAP_Z]} billboard w={300} h={70} opacity={Math.min(1, s * 1.5) * (1 - out)} s={0.8 + 0.2 * s}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          height: 70,
          borderRadius: 10,
          background: rgba(C.bg, 0.92),
          border: `1.5px solid ${C.coral}`,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: '0.2em',
          color: C.ink,
          boxShadow: `0 0 40px ${rgba(C.coral, 0.4)}`,
        }}
      >
        <svg width={26} height={26} viewBox="0 0 18 18">
          <path d="M6.5 2v14M11.5 2v14" stroke={C.coral} strokeWidth={2.6} strokeLinecap="round" />
        </svg>
        SAME GAP
      </div>
    </Card3D>
  );
};

// ---------------- "Straight comparisons." — the 2-word confirmation after the camera has shown it ----------------
const CAP_P = anchor(shot(188), 960, 820, 1500);
const Straight: React.FC<{f: number}> = ({f}) => {
  if (f < T.straight - 1) return null;
  const out = lerp(f, 216, 234, 0, 1, EXPO_IN);
  if (out >= 1) return null;
  const s = spr(f, T.straight, 13, 210, 0.7);
  const flash = pulse(f, T.straight, 8);
  return (
    <Card3D p={[CAP_P[0], CAP_P[1] + out * 260, CAP_P[2]]} billboard w={1060} h={150} opacity={Math.min(1, s * 2) * (1 - out)} s={0.9 + 0.1 * s}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 28,
          height: 150,
          borderRadius: 16,
          background: `linear-gradient(135deg, rgba(160,190,255,0.10), rgba(160,190,255,0) 45%), ${rgba('#050b38', 0.9)}`,
          border: `1px solid ${rgba(A, 0.6)}`,
          boxShadow: `0 30px 80px rgba(2,6,30,0.6), 0 0 ${40 + 90 * flash}px ${rgba(A, 0.3 + 0.4 * flash)}`,
          whiteSpace: 'nowrap',
        }}
      >
        {['Straight', 'comparisons.'].map((w, i) => {
          const k = spr(f, T.straight + i * 3, 14, 200, 0.7);
          return (
            <span key={w} style={{display: 'inline-block', fontFamily: FONT, fontWeight: 700, fontSize: 92, lineHeight: 1, letterSpacing: '-0.035em', color: i === 0 ? A : C.ink, translate: `0px ${(1 - k) * 30}px`, opacity: Math.min(1, k * 2)}}>
              {w}
            </span>
          );
        })}
      </div>
    </Card3D>
  );
};

// ---------------- matrix labels standing in the street ----------------
const HERO = shot(424);
const FACE = faceShot(shot(330));
const labelOut = (f: number, d = 0) => lerp(f, T.exit + 4 + d, T.exit + 22 + d, 0, 1, EXPO_IN);

const MatrixLabels: React.FC<{f: number}> = ({f}) => {
  if (f < T.matrix - 4) return null;
  return (
    <>
      {COUNTRIES.map((c, i) => {
        const s = spr(f, T.cols[i] - 6, 14, 180, 0.7);
        const o = labelOut(f, i * 2);
        if (s <= 0.01 || o >= 1) return null;
        return (
          <Group3D key={c.code} p={[COLX[i], 4 + (1 - s) * -60, rowZ(5) + 118]} r={FACE} order="YXZ">
            <Card3D w={240} h={84} opacity={Math.min(1, s * 1.5) * (1 - o)} nearFade={300}>
              <div style={{textAlign: 'center', whiteSpace: 'nowrap'}}>
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: '0.22em', color: A, textShadow: `0 0 14px ${rgba(A, 0.8)}`}}>{c.code}</div>
                <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.ink, marginTop: 0, textShadow: '0 2px 12px rgba(2,6,30,0.9)'}}>{c.name}</div>
              </div>
            </Card3D>
          </Group3D>
        );
      })}
      {CAPS.map((r, i) => {
        const at = T.matrix + 4 + i * 3;
        const s = spr(f, at, 15, 160, 0.8);
        const o = labelOut(f, 4 + i);
        if (s <= 0.01 || o >= 1) return null;
        return (
          <Group3D key={r.name} p={[COLX[0] - CW / 2 - 62 - (1 - s) * 80, 14, rowZ(i)]} r={FACE} order="YXZ">
            <Card3D w={420} h={60} opacity={Math.min(1, s * 1.6) * (1 - o)} style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', transform: 'translate(-100%, -50%)'}}>
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 32, color: C.ink, whiteSpace: 'nowrap', textShadow: '0 2px 14px rgba(2,6,30,0.95)'}}>{r.name}</div>
            </Card3D>
          </Group3D>
        );
      })}
      {CAPS.flatMap((r, ri) =>
        r.v.map((v, ci) => {
          if (v !== null) return null;
          const isNew = ri === NEW_CELL.r && ci === NEW_CELL.c;
          const s = spr(f, T.cols[ci] + ri * 2, 14, 170, 0.7) * (isNew ? 1 - lerp(f, T.changes[0], T.changes[0] + 10) : 1);
          const o = labelOut(f, 6);
          if (s <= 0.01 || o >= 1) return null;
          return (
            <Group3D key={`u${ri}${ci}`} p={[COLX[ci], 110, rowZ(ri)]} r={FACE} order="YXZ">
              <Card3D w={170} h={40} opacity={s * (1 - o)}>
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: C.soft, textAlign: 'center', lineHeight: '40px', textShadow: '0 2px 10px rgba(2,6,30,0.95)'}}>UNKNOWN</div>
              </Card3D>
            </Group3D>
          );
        }),
      )}
      {(() => {
        // "newly observed" tag on the cell that tick 1 fills
        const s = spr(f, T.changes[0] + 2, 13, 190, 0.7);
        const o = lerp(f, T.changes[0] + 70, T.changes[0] + 84, 0, 1, EXPO_IN) + labelOut(f, 6);
        if (s <= 0.01 || o >= 1) return null;
        return (
          <Group3D p={[COLX[NEW_CELL.c], 200, rowZ(NEW_CELL.r)]} r={FACE} order="YXZ">
            <Card3D w={150} h={44} opacity={Math.min(1, s * 1.5) * (1 - Math.min(1, o))} s={0.7 + 0.3 * s}>
              <div style={{height: 44, borderRadius: 22, border: `1.5px solid ${C.good}`, background: rgba(C.good, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.good}}>
                New
              </div>
            </Card3D>
          </Group3D>
        );
      })()}
    </>
  );
};

// ---------------- holograms (anchored pixel-exact to the hero pose) ----------------
const HFACE = faceShot(HERO);
const at1 = (sx: number, sy: number, w: number, h: number) => anchor(HERO, sx + w / 2, sy + h / 2);
const FILTERS = ['Raw observations', 'Verified vacancies', 'Eligible opportunities', 'Evidence coverage'];

const MatrixHeader: React.FC<{f: number}> = ({f}) => {
  const [x, y, w, h] = [96, 128, 900, 228];
  return (
    <Holo p={at1(x, y, w, h)} r={HFACE} w={w} h={h} accent={A} at={T.matrix - 10} out={T.exit} seed={1} edge="top" flash={pulse(f, T.matrix, 12)}>
      <Row at={T.matrix - 2} x={32} y={18}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 36, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>Country × capability matrix</div>
      </Row>
      <Row at={T.matrix + 4} x={32} y={66}>
        <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 24, color: C.muted, whiteSpace: 'nowrap'}}>Counts of your saved research — not the whole market</div>
      </Row>
      <Sample style={{right: 26, top: 28}} />
      <div style={{position: 'absolute', left: 32, right: 32, top: 112, display: 'flex', flexWrap: 'wrap', gap: 10}}>
        {FILTERS.map((t, i) => {
          const k = lerp(f, T.matrix + 6 + i * 3, T.matrix + 24 + i * 3);
          return (
            <div
              key={t}
              style={{
                height: 44,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 22,
                border: `1px solid ${i === 1 ? C.coral : C.line}`,
                background: i === 1 ? rgba(C.coral, 0.1) : 'transparent',
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 22,
                color: i === 1 ? C.ink : C.muted,
                whiteSpace: 'nowrap',
                opacity: k,
                translate: `0px ${(1 - k) * 12}px`,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
    </Holo>
  );
};

const PX = 1040;
const PW = 800;
const DEMAND = [
  {name: 'AI automation', v: 0.92},
  {name: 'Python', v: 0.78},
  {name: 'Data pipelines', v: 0.61},
  {name: 'Cloud platforms', v: 0.52},
  {name: 'Docker containers', v: 0.4},
];
const Demand: React.FC<{f: number}> = ({f}) => {
  const [y, h] = [132, 312];
  return (
    <Holo p={at1(PX, y, PW, h)} r={HFACE} w={PW} h={h} accent={A} at={T.demand - 14} out={T.exit - 4} seed={2}>
      <div style={{position: 'absolute', left: 32, top: 22, fontWeight: 700, fontSize: 32}}>Capability demand</div>
      <div style={{position: 'absolute', left: 32, top: 64, fontWeight: 500, fontSize: 23, color: C.muted}}>From your saved research</div>
      <Sample style={{right: 26, top: 24}} />
      {DEMAND.map((d, i) => {
        const g = lerp(f, T.demand + i * 3, T.demand + 28 + i * 3, 0, 1, EXPO);
        return (
          <Row key={d.name} at={T.demand - 6 + i * 3} x={32} y={110 + i * 38} style={{right: 32, height: 32, display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 250, fontWeight: 500, fontSize: 23, color: C.muted, whiteSpace: 'nowrap'}}>{d.name}</div>
            <div style={{position: 'relative', width: 446, height: 14, borderRadius: 7, background: C.raised}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * d.v * g}%`, borderRadius: 7, background: `linear-gradient(90deg, ${rgba(A, 0.55)}, ${A})`, boxShadow: `0 0 16px ${rgba(A, 0.55)}`}} />
            </div>
          </Row>
        );
      })}
    </Holo>
  );
};

const SALARY: {code: string; range?: [number, number]}[] = [{code: 'EG', range: [0.18, 0.5]}, {code: 'KW'}, {code: 'SA', range: [0.34, 0.72]}];
const Salary: React.FC<{f: number}> = ({f}) => {
  const [y, h] = [458, 258];
  const egPing = pulse(f, T.changes[1], 14);
  return (
    <Holo p={at1(PX, y, PW, h)} r={HFACE} w={PW} h={h} accent={A} at={T.salary - 6} out={T.exit - 1} seed={3} flash={pulse(f, T.salary, 12)}>
      <div style={{position: 'absolute', left: 32, top: 22, fontWeight: 700, fontSize: 32}}>Salary evidence</div>
      <div style={{position: 'absolute', left: 32, top: 64, fontWeight: 500, fontSize: 22, color: C.muted}}>Illustrative ranges · currencies / units differ</div>
      <Sample style={{right: 26, top: 24}} />
      {SALARY.map((r, i) => {
        const g = lerp(f, T.salary + 4 + i * 4, T.salary + 30 + i * 4, 0, 1, EXPO);
        const ping = i === 0 ? egPing : 0;
        return (
          <Row key={r.code} at={T.salary + i * 4} x={32} y={108 + i * 46} style={{right: 32, height: 36, display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 44, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: A}}>{r.code}</div>
            {r.range ? (
              <>
                <div style={{position: 'relative', width: 400, height: 12, borderRadius: 6, background: C.raised}}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      height: 20,
                      left: `${100 * r.range[0]}%`,
                      width: `${100 * (r.range[1] - r.range[0]) * g}%`,
                      borderRadius: 10,
                      background: `linear-gradient(90deg, ${rgba(C.good, 0.6)}, ${C.good})`,
                      boxShadow: `0 0 ${10 + 30 * ping}px ${rgba(C.good, 0.4 + 0.6 * ping)}`,
                    }}
                  />
                </div>
                <div style={{display: 'flex', alignItems: 'center', height: 34, padding: '0 13px', borderRadius: 17, border: `1px solid ${rgba(C.good, 0.5)}`, background: rgba(C.good, 0.1 + 0.25 * ping), fontWeight: 500, fontSize: 22, color: C.good, opacity: g, whiteSpace: 'nowrap'}}>
                  Sourced · dated
                </div>
              </>
            ) : (
              <>
                <div style={{width: 200, height: 12, borderRadius: 6, border: `1.5px dashed ${rgba(C.soft, 0.6)}`}} />
                <div style={{fontWeight: 500, fontSize: 22, color: C.soft, opacity: g, whiteSpace: 'nowrap'}}>Undisclosed pay stays unknown</div>
              </>
            )}
          </Row>
        );
      })}
    </Holo>
  );
};

const CHANGES = ['Data pipelines — newly observed in Kuwait', 'Salary evidence — added for Egypt', 'Sources — re-checked and dated'];
const Changes: React.FC<{f: number}> = ({f}) => {
  const [y, h] = [730, 226];
  return (
    <Holo p={at1(PX, y, PW, h)} r={HFACE} w={PW} h={h} accent={A} at={T.changes[0] - 16} out={T.exit + 2} seed={4}>
      <div style={{position: 'absolute', left: 32, top: 22, fontWeight: 700, fontSize: 32}}>What changed</div>
      {CHANGES.map((t, i) => {
        const at = T.changes[i];
        const k = spr(f, at, 13, 210, 0.6);
        const glow = pulse(f, at, 9);
        return (
          <div key={t} style={{position: 'absolute', left: 32, right: 32, top: 76 + i * 46, height: 38, display: 'flex', alignItems: 'center', gap: 16}}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                border: `1.5px solid ${k > 0.05 ? C.good : C.line}`,
                background: rgba(C.good, 0.14 * k),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scale: `${1 + 0.35 * glow}`,
                boxShadow: glow > 0.02 ? `0 0 ${20 * glow}px ${rgba(C.good, glow)}` : undefined,
              }}
            >
              <IconCheck size={24} color={C.good} draw={lerp(f, at, at + 10)} />
            </div>
            <div style={{fontWeight: 500, fontSize: 24, color: k > 0.05 ? C.ink : C.soft, opacity: 0.5 + 0.5 * Math.min(1, k), whiteSpace: 'nowrap'}}>{t}</div>
          </div>
        );
      })}
    </Holo>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <>
      {/* foreground dust: high over the city for the top-down act, then along the street */}
      {f < 230 ? <Dust seed={71} n={46} min={[-1500, 1700, -1300]} max={[1500, 2900, 1100]} accent={A} drift={[0.2, 0.9, 0.2]} size={[6, 22]} /> : null}
      {f > 150 ? <Dust seed={72} n={60} min={[-900, 60, -200]} max={[2300, 1000, 1500]} accent={A} drift={[0.5, 0.05, 0.6]} size={[5, 16]} /> : null}
      <Title f={f} />
      <Gauges f={f} />
      <SameGap f={f} />
      <Straight f={f} />
      <MatrixLabels f={f} />
      <MatrixHeader f={f} />
      <Demand f={f} />
      <Salary f={f} />
      <Changes f={f} />
    </>
  );
};


