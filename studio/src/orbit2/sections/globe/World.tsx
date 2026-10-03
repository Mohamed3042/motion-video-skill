// Station 2 · THE GLOBE (sky). CSS-3D layer in LOCAL coords: the in-scene title beside the turning disc, the
// reveal caption, and a column of glass holograms to the right of the globe — research scope chips, the country
// dossier and the Plan → Mine → Verify → Build stepper — that the camera drifts down, one beat each.
import React from 'react';
import {C, MONO} from '../../brand';
import type {V3} from '../../engine/math';
import {useWorldFrame} from '../../engine/space';
import {Arrow} from '../../shared';
import {bez, Button, Caption3D, Chip, Comet, ease, Holo, Motes, prog, pulse, rgba, rowIn, SampleTag, Title3D} from '../profile/holo';
import {GEO} from './geo';
import {COUNTRIES, onGlobe, selAt, T} from './scene';

const A = C.sky;

// v1's real outlines, fitted into each chip
const OUTLINES = COUNTRIES.map((c) => {
  const all = GEO[c.id].flat();
  const xs = all.filter((_, i) => i % 2 === 0);
  const ys = all.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const k = Math.min(150 / (maxX - minX), 104 / (maxY - minY));
  return GEO[c.id]
    .map((poly) => poly.reduce((s, n, i) => (i % 2 ? s : s + (i ? 'L' : 'M') + (80 + (n - (minX + maxX) / 2) * k).toFixed(1) + ' ' + (60 - (poly[i + 1] - (minY + maxY) / 2) * k).toFixed(1)), '') + 'Z')
    .join('');
});

const H1 = {p: [880, 320, 40] as V3, w: 780, h: 330};
const H2 = {p: [880, -100, 20] as V3, w: 780, h: 440};
const H3 = {p: [880, 330, 60] as V3, w: 780, h: 134};
const chipWorld = (k: number): V3 => [H1.p[0] - 244 + 244 * k, H1.p[1] - 75, H1.p[2] + 12];
const SEL_AT = [T.scope + 22, T.kw, T.sa];

const Scope: React.FC<{f: number}> = ({f}) => {
  const sel = selAt(f);
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em', color: A, height: 30}}>RESEARCH SCOPE · SAMPLE VIEW</div>
      <div style={{fontSize: 42, fontWeight: 700, marginTop: 12, ...rowIn(f, T.scope + 8)}}>Where will you look next?</div>
      <div style={{display: 'flex', gap: 16, marginTop: 22}}>
        {COUNTRIES.map((c, i) => {
          const on = i === sel;
          const p = pulse(f, SEL_AT[i], 24) * (on ? 1 : 0);
          return (
            <div
              key={c.id}
              style={{
                width: 228,
                height: 176,
                boxSizing: 'border-box',
                borderRadius: 12,
                textAlign: 'center',
                paddingTop: 10,
                background: on ? rgba(A, 0.16) : 'rgba(4,11,54,0.7)',
                border: `1px solid ${on ? A : C.line}`,
                boxShadow: on ? `0 0 ${22 + 40 * p}px ${rgba(A, 0.35 + 0.4 * p)}` : undefined,
                transform: `translateY(${on ? -6 : 0}px)`,
                ...rowIn(f, T.scope + 14 + i * 6, 0),
              }}
            >
              <svg width={160} height={120} viewBox="0 0 160 120">
                <path d={OUTLINES[i]} fill={rgba(A, on ? 0.3 : 0.14)} stroke={on ? '#e6f0ff' : A} strokeWidth={on ? 1.4 : 1} />
              </svg>
              <div style={{fontSize: 26, fontWeight: 600, marginTop: 2}}>{c.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dossier: React.FC<{f: number}> = ({f}) => {
  const c = COUNTRIES[selAt(f)];
  const sw = pulse(f, T.sa, 20);
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em', color: A}}>COUNTRY DOSSIER</div>
        <SampleTag fs={18} />
      </div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, ...rowIn(f, T.kw + 8)}}>
        <div style={{opacity: 1 - 0.6 * sw}}>
          <div style={{fontSize: 40, fontWeight: 700}}>{c.city}</div>
          <div style={{fontSize: 25, color: C.muted, marginTop: 6}}>Explore the research you have saved</div>
        </div>
        <Chip label={c.id} color={A} fs={25} on={0.4 + 0.6 * sw} mono />
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18}}>
        {['Verified open roles', 'Eligible opportunities', 'Salary evidence', 'Source coverage'].map((s, i) => (
          <div key={s} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, padding: '0 18px', borderRadius: 10, border: `1px solid ${C.line}`, background: 'rgba(4,11,54,0.6)', fontSize: 24, ...rowIn(f, T.kw + 14 + i * 5)}}>
            {s}
            <Arrow size={22} color={A} />
          </div>
        ))}
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 18, ...rowIn(f, T.kw + 36)}}>
        <Button label="Open country workspace" primary fs={24} h={56} />
        <Button label="Sources" fs={24} h={56} />
      </div>
      <div style={{fontSize: 22, color: C.muted, marginTop: 14, ...rowIn(f, T.kw + 44)}}>Location filters describe a market, not your eligibility.</div>
    </div>
  );
};

const Stepper: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', alignItems: 'center', height: '100%', gap: 0}}>
    {['Plan', 'Mine', 'Verify', 'Build'].map((s, i) => {
      const p = pulse(f, T.steps[i], 26);
      return (
        <React.Fragment key={s}>
          {i ? <div style={{flex: 1, height: 2, margin: '0 14px', background: `linear-gradient(90deg, ${rgba(A, 0.3 + 0.6 * pulse(f, T.steps[i] - 4, 14))}, ${rgba(A, 0.3)})`}} /> : null}
          <div style={{display: 'flex', alignItems: 'center', gap: 12, ...rowIn(f, T.sa + 6 + i * 5, 16)}}>
            <div style={{width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 22, color: p > 0.3 ? C.deep : A, background: p > 0.3 ? A : 'rgba(4,11,54,0.8)', border: `2px solid ${A}`, boxShadow: `0 0 ${8 + 30 * p}px ${rgba(A, 0.3 + 0.6 * p)}`}}>{i + 1}</div>
            <div style={{fontSize: 28, fontWeight: 600}}>{s}</div>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <>
      <Title3D p={[794, 180, 200]} r={[0, -8, 0]} idx={2} name="THE GLOBE" promise="Give your search coordinates." accent={A} from={6} promiseAt={T.promise} out={T.titleOut} size={112} />
      <Caption3D p={[0, 640, 120]} billboard at={T.tilt[0] + 18} out={T.inflate + 4} accent={A} fs={64}>
        Flat circles.
      </Caption3D>

      <Holo {...H1} accent={A} at={T.scope} out={T.sa - 26} r={[0, -4, 0]} edge="left" seed={4} pad={32}>
        <Scope f={f} />
      </Holo>
      <Holo {...H2} accent={A} at={T.kw} out={T.out + 4} r={[0, -4, 0]} edge="left" seed={5} pad={32} glow={pulse(f, T.sa, 30)}>
        <Dossier f={f} />
      </Holo>
      <Holo {...H3} accent={A} at={T.sa} out={T.out + 8} r={[0, -4, 0]} edge="bottom" seed={6} pad={28}>
        <Stepper f={f} />
      </Holo>

      {/* a beam from the chip in scope to its place on the globe */}
      {COUNTRIES.map((c, k) => {
        const a = SEL_AT[k];
        const end = onGlobe(c.lon, c.lat, a + 20, 1.02);
        const st = k === 2 ? ([H2.p[0] + 318, H2.p[1] + 118, H2.p[2] + 12] as V3) : chipWorld(k);
        return <Comet key={c.id} path={bez(st, [(st[0] + end[0]) / 2, Math.max(st[1], end[1]) + 220, 420], end)} a={a} b={a + 20} color={A} size={54} trail={16} ease={ease.inOut} />;
      })}

      <Motes seed={202} n={28} box={[-1600, 2400, -1100, 1100, -400, 3000]} color={A} size={[8, 44]} />
    </>
  );
};
