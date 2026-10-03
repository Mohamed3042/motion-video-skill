// Sound Lab: the tool rail and the eight quick tool beats (one gesture each, heard in the soundtrack on its frame).
import React from 'react';
import {C, FONT, MONO, RADIUS} from '../../brand';
import {mulberry32} from '../../timing';
import {G, ONSETS, T, TOOLS, type ToolId} from './timing';
import {Check, Field, Knob, Mono, Primary, SAGE, Slider, Toggle, ToolLabel, back, clamp, eio, eo, mix, mixHex, prog, pulse, rgba} from './ui';

const CARD = {x: 96, y: 196, w: 1728, h: 520};
const VW = 990; // visual area (right side of the card)
const VH = 450;

// ---------------------------------------------------------------- rail ----
const RAIL = ['AUDIO REPAIR', ...TOOLS.map((t) => t.name)];
export const Rail: React.FC<{f: number}> = ({f}) => {
  if (f < T.dock || f > T.exit + 20) return null;
  const a = eo(prog(f, T.dock + 6, T.dock + 22)) * (1 - prog(f, T.exit, T.exit + 16));
  const active = f < 480 ? 0 : 1 + TOOLS.findIndex((t) => f >= t.f && f < t.f + t.len);
  return (
    <div style={{position: 'absolute', left: CARD.x, top: 138, width: CARD.w, display: 'flex', gap: 8, opacity: a, transform: `translateY(${(1 - a) * -10}px)`}}>
      {RAIL.map((n, i) => {
        const on = i === active;
        const done = i < active || (active === -1 && f >= T.exit) || (i === 0 && f >= T.repair);
        const lit = eo(prog(f, i === 0 ? T.dock : TOOLS[i - 1].f - 2, i === 0 ? T.dock + 8 : TOOLS[i - 1].f + 6));
        return (
          <div
            key={n}
            style={{
              flex: n.length + 6,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: RADIUS.control,
              border: `1px solid ${on ? SAGE : C.line}`,
              background: on ? rgba(SAGE, 0.16) : C.panel,
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: '0.1em',
              color: on ? SAGE : done ? C.text : rgba(C.muted, 0.6),
              transform: on ? `translateY(${-3 * (1 - lit)}px)` : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {done && !on ? <Check size={14} /> : null}
            {n}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- shared bits ----
const seeded = (seed: number, n: number) => {
  const r = mulberry32(seed);
  return Array.from({length: n}, () => r());
};
const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

// ---------------------------------------------------------------- 02 DIALOGUE MIXER ----
const Mixer: React.FC<{f: number}> = ({f}) => {
  const k = eo(prog(f, G.presence, G.presence + 12));
  const X0 = 40;
  const X1 = 960;
  const xOf = (hz: number) => X0 + ((Math.log10(hz) - Math.log10(20)) / 3) * (X1 - X0);
  const yOf = (db: number) => 210 - db * 11;
  const sig = (x: number) => 1 / (1 + Math.exp(-x));
  const gain = (hz: number) => {
    const l = Math.log2(hz);
    return -11 * (1 - k) * sig((l - Math.log2(2200)) * 1.8) - 16 * k * sig(-(l - Math.log2(95)) * 2.6) + 7 * k * Math.exp(-0.5 * ((l - Math.log2(3300)) / 0.7) ** 2);
  };
  const pts: [number, number][] = [];
  const spec: [number, number][] = [];
  for (let i = 0; i <= 180; i++) {
    const hz = 20 * 1000 ** (i / 180);
    pts.push([xOf(hz), yOf(gain(hz))]);
    const voice = Math.exp(-0.5 * ((Math.log2(hz) - Math.log2(500)) / 1.6) ** 2) * (0.85 + 0.15 * Math.sin(i * 0.7 + f * 0.4));
    spec.push([xOf(hz), 400 - voice * (150 + 40 * k * Math.exp(-0.5 * ((Math.log2(hz) - Math.log2(3300)) / 0.8) ** 2)) - 10]);
  }
  const gr = f < G.presence ? 0.28 + 0.3 * Math.abs(Math.sin(f * 0.52)) : 0.44 + 0.02 * Math.sin(f * 0.3);
  return (
    <svg width={VW} height={VH}>
      {[100, 1000, 10000].map((hz) => (
        <g key={hz}>
          <line x1={xOf(hz)} x2={xOf(hz)} y1={20} y2={400} stroke={rgba(C.text, 0.07)} />
          <text x={xOf(hz) + 6} y={396} fill={rgba(C.muted, 0.8)} fontFamily={MONO} fontSize={13}>
            {hz >= 1000 ? `${hz / 1000}k` : hz}
          </text>
        </g>
      ))}
      {[-12, 0, 6].map((db) => (
        <line key={db} x1={X0} x2={X1} y1={yOf(db)} y2={yOf(db)} stroke={rgba(C.text, db === 0 ? 0.14 : 0.06)} strokeDasharray={db ? '4 6' : undefined} />
      ))}
      <path d={`${path(spec)}L${X1} 400L${X0} 400Z`} fill={rgba(SAGE, 0.14)} />
      <path d={path(spec)} stroke={rgba(SAGE, 0.5)} strokeWidth={1.5} fill="none" />
      <path d={path(pts)} stroke={rgba(C.amber, 0.35)} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={path(pts)} stroke={C.amber} strokeWidth={4} fill="none" strokeLinecap="round" />
      {[95, 3300].map((hz) => (
        <circle key={hz} cx={xOf(hz)} cy={yOf(gain(hz))} r={9 * k} fill={C.amber} stroke={C.onAmber} strokeWidth={2} />
      ))}
      <text x={X0} y={436} fill={C.muted} fontFamily={FONT} fontSize={17}>
        Gain reduction
      </text>
      <rect x={180} y={424} width={780} height={12} rx={6} fill={C.line} />
      <rect x={180} y={424} width={780 * gr} height={12} rx={6} fill={f < G.presence ? C.muted : SAGE} />
    </svg>
  );
};
const MixerControls: React.FC<{f: number}> = ({f}) => {
  const k = eo(prog(f, G.presence, G.presence + 12));
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
      <div style={{display: 'flex', gap: 10}}>
        <Knob label={'Compressor\nthreshold (dB)'} v={mix(0.3, 0.62, k)} />
        <Knob label="Compression ratio" v={mix(0.18, 0.52, k)} />
      </div>
      <Slider label="Presence (dB)" v={mix(0.32, 0.78, k)} w={420} />
    </div>
  );
};

// ---------------------------------------------------------------- 03 DIALOGUE NOISE ----
const NB = 150;
const NOISE = seeded(31, NB);
const SYL = [0.12, 0.26, 0.37, 0.55, 0.66, 0.84];
const speechEnv = (u: number) => SYL.reduce((a, c, i) => a + (0.55 + 0.4 * ((i * 7) % 3) / 2) * Math.exp(-0.5 * ((u - c) / 0.035) ** 2), 0);
const Noise: React.FC<{f: number}> = ({f}) => {
  const k = eo(prog(f, G.noiseOff, G.noiseOff + 10));
  const mid = 210;
  return (
    <svg width={VW} height={VH}>
      <line x1={20} x2={VW - 20} y1={mid} y2={mid} stroke={rgba(C.text, 0.12)} />
      {/* the noise floor: a fizzing band between and under the words, gone at G.noiseOff */}
      <rect x={24} y={mid - 64 * (1 - k)} width={VW - 48} height={128 * (1 - k)} fill={rgba(C.muted, 0.08)} />
      {Array.from({length: NB}, (_, i) => {
        const u = i / (NB - 1);
        const n = (0.2 + 0.16 * NOISE[i]) * (0.7 + 0.3 * Math.sin(i * 1.9 + f * 0.8)) * (1 - k);
        const e = speechEnv(u);
        const x = 24 + u * (VW - 48);
        return (
          <g key={i}>
            <rect x={x - 1.6} y={mid - e * 170} width={3.2} height={e * 340 + 1} fill={SAGE} rx={1.6} opacity={0.4 + 0.6 * clamp(e * 2)} />
            <rect x={x + 1.7} y={mid - n * 175} width={1.6} height={n * 350} fill={rgba(C.muted, 0.85)} rx={0.8} />
          </g>
        );
      })}
      <text x={24} y={mid + 112 - 30 * k} fill={k > 0.5 ? SAGE : C.muted} fontFamily={MONO} fontSize={15} fontWeight={700} letterSpacing={2}>
        {k > 0.5 ? 'NOISE FLOOR REDUCED · SPEECH KEPT' : 'NOISE FLOOR'}
      </text>
    </svg>
  );
};
const NoiseControls: React.FC<{f: number}> = ({f}) => {
  const k = eo(prog(f, G.noiseOff, G.noiseOff + 10));
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
      <Slider label="Noise reduction (dB)" v={mix(0.15, 0.72, k)} w={420} />
      <Toggle label="Adaptive reduction" on={1} />
    </div>
  );
};

// ---------------------------------------------------------------- 04 MICROPHONE ALIGNMENT ----
const sq = (p: number) => Math.sin(p) + Math.sin(3 * p) / 3 + Math.sin(5 * p) / 5;
const Mic: React.FC<{f: number}> = ({f}) => {
  const align = eo(prog(f, G.align, G.align + 8));
  const off = Math.PI * (1 - align);
  const pol = f < G.flip ? 1 : f < G.unflip ? Math.cos(Math.PI * eio(prog(f, G.flip, G.flip + 6))) : Math.cos(Math.PI * (1 - eio(prog(f, G.unflip, G.unflip + 6))));
  const ph = f * 0.16;
  const W0 = 120;
  const W1 = VW - 30;
  const lane = (y: number, amp: number, fn: (p: number) => number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 220; i++) {
      const x = W0 + (i / 220) * (W1 - W0);
      pts.push([x, y - amp * fn((i / 220) * Math.PI * 7 + ph)]);
    }
    return path(pts);
  };
  const doubled = (f >= G.align && f < G.flip) || f >= G.unflip;
  const flash = Math.max(pulse(f, G.align, 14), pulse(f, G.unflip, 14));
  const sumAmp = (p: number) => (sq(p) + pol * sq(p - off)) / 2;
  const status = f < G.align ? 'CANCELLED · HALF A CYCLE LATE' : f < G.flip ? 'ALIGNED · DOUBLED' : f < G.unflip ? 'POLARITY INVERTED · CANCELLED' : 'POLARITY CORRECTED · DOUBLED';
  return (
    <svg width={VW} height={VH}>
      {[
        ['MIC 1', 70],
        ['MIC 2', 190],
        ['SUM', 330],
      ].map(([l, y]) => (
        <g key={l as string}>
          <line x1={W0} x2={W1} y1={y as number} y2={y as number} stroke={rgba(C.text, 0.1)} />
          <text x={10} y={(y as number) + 5} fill={l === 'SUM' ? C.amber : C.muted} fontFamily={MONO} fontSize={16} fontWeight={700} letterSpacing={2}>
            {l}
          </text>
        </g>
      ))}
      <path d={lane(70, 36, sq)} stroke={SAGE} strokeWidth={3} fill="none" />
      <path d={lane(190, 36, (p) => pol * sq(p - off))} stroke={C.text} strokeWidth={3} fill="none" opacity={0.85} />
      {f < G.align + 8 ? (
        <g opacity={1 - align}>
          <line x1={W0 + 140} x2={W0 + 140 + (off / (Math.PI * 7)) * (W1 - W0)} y1={128} y2={128} stroke={C.amber} strokeWidth={2} />
          <text x={W0 + 140} y={120} fill={C.amber} fontFamily={MONO} fontSize={13}>
            DELAY
          </text>
        </g>
      ) : null}
      <path d={lane(330, 46, sumAmp)} stroke={rgba(C.amber, 0.3 + 0.4 * flash)} strokeWidth={14} fill="none" opacity={doubled ? 1 : 0} />
      <path d={lane(330, 46, sumAmp)} stroke={doubled ? C.amber : C.muted} strokeWidth={doubled ? 4 : 3} fill="none" />
      <text x={W0} y={428} fill={doubled ? C.amber : C.muted} fontFamily={MONO} fontSize={15} fontWeight={700} letterSpacing={2}>
        {status}
      </text>
    </svg>
  );
};
const MicControls: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
    <Field label="Alignment mode" value="Dynamic" on={f >= G.align && f < G.align + 20 ? 1 : 0} />
    <Field label="Inverted polarity" value={f >= G.unflip ? 'Correct' : 'Preserve'} on={f >= G.unflip ? 1 : 0} />
    <Field label="Maximum delay (milliseconds)" value="Auto-tracked" />
  </div>
);

// ---------------------------------------------------------------- 05 ROOM REDUCTION ----
const stabBars = (x0: number, amp: number, n: number, seed: number) => {
  const r = seeded(seed, n);
  return Array.from({length: n}, (_, i) => ({x: x0 + i * 6, h: amp * (0.25 + 0.75 * r[i]) * Math.exp(-i / 9) * Math.min(1, (i + 1) / 2)}));
};
const STAB = stabBars(0, 170, 34, 77);
const Room: React.FC<{f: number}> = ({f}) => {
  const k = eio(prog(f, G.dry, G.dry + 9));
  const flash = pulse(f, G.dry, 16);
  const mid = 210;
  const born = (i: number) => eo(prog(f, 690 + i * 7.5, 690 + i * 7.5 + 6));
  // decay envelope: a long room tail that collapses to the dry stab
  const tau = mix(330, 46, k);
  const env: [number, number][] = [];
  for (let x = 0; x <= 880; x += 8) env.push([60 + x, mid - 182 * Math.exp(-x / tau) - 4]);
  return (
    <svg width={VW} height={VH}>
      <line x1={20} x2={VW - 20} y1={mid} y2={mid} stroke={rgba(C.text, 0.12)} />
      {[4, 3, 2, 1].map((i) => {
        const dx = 165 * i * (1 - k);
        const a = (0.62 ** i + 0.1) * born(i) * (1 - k);
        return (
          <g key={i} transform={`translate(${60 + dx} ${mid}) scale(${1 + 0.3 * i * (1 - k)} ${0.72 ** i}) translate(0 ${-mid})`} opacity={a}>
            {STAB.map((b, j) => (
              <rect key={j} x={b.x - 1.6} y={mid - b.h} width={3.2} height={b.h * 2} rx={1.6} fill={SAGE} opacity={0.75} />
            ))}
          </g>
        );
      })}
      <g transform="translate(60 0)">
        {STAB.map((b, j) => (
          <rect key={j} x={b.x - 1.6} y={mid - b.h} width={3.2} height={b.h * 2} rx={1.6} fill={mixHex(SAGE, C.text, flash)} />
        ))}
      </g>
      <path d={path(env)} stroke={rgba(C.amber, 0.85)} strokeWidth={2.5} strokeDasharray="6 7" fill="none" />
      <text x={60} y={mid + 230} fill={f < G.dry ? C.amber : SAGE} fontFamily={MONO} fontSize={15} fontWeight={700} letterSpacing={2}>
        {f < G.dry ? 'ECHO TRAILS · LATE REFLECTIONS' : 'ONE DRY STAB'}
      </text>
    </svg>
  );
};
const RoomControls: React.FC<{f: number}> = ({f}) => {
  const k = eo(prog(f, G.dry, G.dry + 9));
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
      <Toggle label="Reduce late reflections" on={k} />
      <Slider label="Dry blend" v={mix(0.7, 0.22, k)} w={420} />
    </div>
  );
};

// ---------------------------------------------------------------- 06 DIALOGUE LEVELER ----
const LN = 64;
const LRAW = (() => {
  const r = mulberry32(9);
  let v = 0.6;
  return Array.from({length: LN}, (_, i) => {
    v = clamp(v + (r() - 0.5) * 0.5 + (i % 11 === 4 ? 0.42 : 0) - (i % 7 === 2 ? 0.3 : 0) - (v > 1 ? 0.25 : 0), 0.12, 1.16);
    return v;
  });
})();
const Leveler: React.FC<{f: number}> = ({f}) => {
  const X0 = 30;
  const X1 = VW - 30;
  const yOf = (v: number) => 380 - v * 260;
  const CEIL = 1;
  const pts: [number, number][] = LRAW.map((v, i) => {
    const k = eio(prog(f, G.level + i * 0.14, G.level + 7 + i * 0.14));
    const even = 0.86 + 0.025 * Math.sin(i * 0.9);
    return [X0 + (i / (LN - 1)) * (X1 - X0), yOf(mix(v, even, k))];
  });
  const over = f < G.level + 8;
  return (
    <svg width={VW} height={VH}>
      <defs>
        <linearGradient id="lvfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={SAGE} stopOpacity={0.35} />
          <stop offset="1" stopColor={SAGE} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${path(pts)}L${X1} 380L${X0} 380Z`} fill="url(#lvfill)" />
      <line x1={X0} x2={X1} y1={yOf(CEIL)} y2={yOf(CEIL)} stroke={C.amber} strokeWidth={2} strokeDasharray="8 8" />
      <text x={X0} y={yOf(CEIL) - 90} fill={C.amber} fontFamily={MONO} fontSize={15} fontWeight={700} letterSpacing={2}>
        PEAK CEILING
      </text>
      <line x1={X0 + 8} x2={X0 + 8} y1={yOf(CEIL) - 82} y2={yOf(CEIL) - 4} stroke={C.amber} strokeWidth={1.5} />
      <path d={path(pts)} stroke={SAGE} strokeWidth={4} fill="none" strokeLinejoin="round" />
      {over
        ? pts.map(([x, y], i) => (y < yOf(CEIL) ? <circle key={i} cx={x} cy={y} r={6} fill={C.error} opacity={1 - prog(f, G.level, G.level + 8)} /> : null))
        : null}
      <line x1={X0} x2={X1} y1={380} y2={380} stroke={rgba(C.text, 0.12)} />
    </svg>
  );
};
const LevelerControls: React.FC<{f: number}> = ({f}) => {
  const k = eo(prog(f, G.level, G.level + 10));
  return (
    <div style={{display: 'flex', gap: 10}}>
      <Knob label={'Maximum gain\nmultiplier'} v={mix(0.25, 0.6, k)} />
      <Knob label={'Analysis window\n(milliseconds)'} v={mix(0.5, 0.42, k)} />
    </div>
  );
};

// ---------------------------------------------------------------- 07 LOUDNESS DELIVERY ----
const LW = seeded(51, 120);
const Loudness: React.FC<{f: number}> = ({f}) => {
  const TGT = 0.74;
  const p1 = prog(f, 810, G.pass2);
  const p2 = eio(prog(f, G.pass2, G.target));
  const fill = f < G.pass2 ? 0.44 * eo(p1) + 0.015 * Math.sin(f * 1.3) * (1 - p1) : mix(0.44, TGT, p2);
  const hit = pulse(f, G.target, 18);
  const landed = f >= G.target;
  const gainW = f < G.pass2 ? 0.45 : mix(0.45, 1, p2);
  const scan = f < G.pass2 ? p1 : prog(f, G.pass2, G.target);
  const MX = 30;
  const MW = VW - 60;
  return (
    <div style={{position: 'relative', width: VW, height: VH}}>
      {/* waveform being measured / normalised */}
      <svg width={VW} height={150} style={{position: 'absolute', left: 0, top: 10}}>
        {LW.map((r, i) => {
          const x = MX + (i / 119) * MW;
          const h = (12 + 46 * r * (0.5 + 0.5 * Math.sin(i * 0.35))) * gainW;
          return <rect key={i} x={x - 2} y={70 - h} width={4} height={2 * h} rx={2} fill={x < MX + scan * MW ? SAGE : rgba(C.muted, 0.5)} />;
        })}
        <rect x={MX + scan * MW - 1} y={0} width={2} height={140} fill={C.amber} opacity={landed ? 0 : 1} />
      </svg>
      {/* passes */}
      <div style={{position: 'absolute', left: MX, top: 182, display: 'flex', gap: 12}}>
        {[
          ['PASS 1 · MEASURE', 810, G.pass2],
          ['PASS 2 · NORMALIZE', G.pass2, G.target],
        ].map(([l, a, b]) => {
          const on = f >= (a as number) && f < (b as number);
          const done = f >= (b as number);
          return (
            <div key={l as string} style={{display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: RADIUS.control, border: `1px solid ${on ? C.amber : C.line}`, background: on ? rgba(C.amber, 0.12) : C.raised}}>
              {done ? <Check size={16} /> : null}
              <Mono size={14} color={on ? C.amber : done ? C.text : C.muted} spacing={0.14}>
                {l}
              </Mono>
            </div>
          );
        })}
        <div style={{display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: RADIUS.control, background: rgba(SAGE, 0.16), border: `1px solid ${SAGE}`, opacity: eo(prog(f, G.target + 4, G.target + 12)), transform: `scale(${back(prog(f, G.target + 4, G.target + 12))})`}}>
          <Check size={16} p={eo(prog(f, G.target + 6, G.target + 14))} />
          <Mono size={14} color={SAGE} spacing={0.14}>
            MEASURED
          </Mono>
        </div>
      </div>
      {/* meter */}
      <div style={{position: 'absolute', left: MX, top: 300, width: MW, height: 54, borderRadius: RADIUS.control, background: C.raised, border: `1px solid ${C.line}`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: landed ? SAGE : `linear-gradient(90deg, ${rgba(C.muted, 0.35)}, ${C.muted})`, boxShadow: hit ? `0 0 30px ${rgba(SAGE, hit)}` : undefined}} />
        {Array.from({length: 21}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: `${(i / 20) * 100}%`, top: i % 5 ? 40 : 32, width: 1, bottom: 0, background: rgba(C.canvas, 0.6)}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: MX + TGT * MW - 2, top: 284, width: 4, height: 86, background: C.amber, boxShadow: `0 0 ${8 + 30 * hit}px ${C.amber}`}} />
      <div style={{position: 'absolute', left: MX + TGT * MW - 40, top: 386, width: 80, textAlign: 'center'}}>
        <Mono size={17} color={C.amber} spacing={0.12}>
          Target
        </Mono>
      </div>
    </div>
  );
};
const LoudnessControls: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
    <Field label="Integrated loudness (LUFS)" value="Recipient target" on={f >= G.pass2 && f < G.target + 10 ? 1 : 0} />
    <Field label="True peak ceiling (dBTP)" value="Recipient ceiling" />
    <Field label="Loudness range (LU)" value="Measured" />
  </div>
);

// ---------------------------------------------------------------- 08 BEAT MARKERS ----
const Beats: React.FC<{f: number}> = ({f}) => {
  const X0 = 40;
  const X1 = VW - 40;
  const xOf = (fr: number) => X0 + ((fr - 896) / 66) * (X1 - X0);
  const TY = 250;
  const play = xOf(Math.min(f, 962));
  const spikes: React.ReactNode[] = [];
  for (let i = 0; i < 160; i++) {
    const fr = 896 + (i / 159) * 66;
    let a = 0.06 + 0.04 * Math.sin(i * 2.3);
    for (const o of ONSETS) if (fr >= o) a = Math.max(a, Math.exp(-(fr - o) / 1.4) * (o === 900 ? 1 : 0.8));
    const x = xOf(fr);
    spikes.push(<rect key={i} x={x - 1.4} y={TY + 70 - a * 62} width={2.8} height={a * 124 + 1} rx={1.4} fill={x <= play ? SAGE : rgba(C.muted, 0.45)} />);
  }
  return (
    <svg width={VW} height={VH}>
      <rect x={X0 - 10} y={TY} width={X1 - X0 + 20} height={140} rx={6} fill={C.raised} stroke={C.line} />
      {spikes}
      <text x={X0} y={TY + 172} fill={C.muted} fontFamily={MONO} fontSize={14} letterSpacing={2}>
        ONSET CANDIDATES · REVIEW BEFORE EXPORT
      </text>
      {ONSETS.map((o, i) => {
        const fallStart = o - 13;
        const u = prog(f, fallStart, o);
        if (u <= 0) return null;
        const y = mix(-30, TY - 4, u * u);
        const x = xOf(o);
        const land = pulse(f, o, 12);
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y - 40 * (1 - u)} y2={y} stroke={rgba(C.amber, 0.5 * (1 - u))} strokeWidth={2} />
            <path d={`M${x - 10} ${y - 16} L${x + 10} ${y - 16} L${x} ${y}Z`} fill={C.amber} />
            {u >= 1 ? <line x1={x} x2={x} y1={TY} y2={TY + 140} stroke={C.amber} strokeWidth={2} opacity={0.85} /> : null}
            {land > 0 ? <circle cx={x} cy={TY} r={10 + 26 * (1 - land)} fill="none" stroke={C.amber} strokeWidth={2} opacity={land} /> : null}
          </g>
        );
      })}
      <line x1={play} x2={play} y1={TY - 6} y2={TY + 146} stroke={C.text} strokeWidth={2} opacity={0.6} />
    </svg>
  );
};
const BeatControls: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'flex-start'}}>
    <Slider label="Minimum marker spacing (seconds)" v={0.3} w={420} />
    <Primary label="Find markers" press={pulse(f, 900, 12)} />
  </div>
);

// ---------------------------------------------------------------- 09 SPEECH CLEANUP ----
const SB = 120;
const SN = seeded(88, SB);
const Speech: React.FC<{f: number}> = ({f}) => {
  const sweep = eio(prog(f, G.clean, G.clean + 10));
  const mid = 210;
  return (
    <svg width={VW} height={VH}>
      <line x1={20} x2={VW - 20} y1={mid} y2={mid} stroke={rgba(C.text, 0.12)} />
      {Array.from({length: SB}, (_, i) => {
        const u = i / (SB - 1);
        const x = 30 + u * (VW - 60);
        const clean = x < 30 + sweep * (VW - 60);
        const syl = [0.1, 0.22, 0.35, 0.48, 0.6, 0.74, 0.88].reduce((a, c, j) => a + (0.7 + 0.3 * (j % 2)) * Math.exp(-0.5 * ((u - c) / 0.03) ** 2), 0);
        const smear = [0.1, 0.22, 0.35, 0.48, 0.6, 0.74, 0.88].reduce((a, c) => a + 0.55 * Math.exp(-0.5 * ((u - c - 0.02) / 0.07) ** 2), 0);
        const h = clean ? syl * 160 : (0.6 * smear + 0.22 * SN[i] * (0.7 + 0.3 * Math.sin(f * 0.9 + i))) * 160;
        return <rect key={i} x={x - 2.2} y={mid - h} width={4.4} height={2 * h + 1} rx={2.2} fill={clean ? SAGE : rgba(C.muted, 0.6)} />;
      })}
      {f >= G.clean && f < G.clean + 12 ? <rect x={30 + sweep * (VW - 60) - 2} y={20} width={4} height={380} fill={C.amber} opacity={1 - prog(f, G.clean + 8, G.clean + 12)} /> : null}
      <text x={30} y={428} fill={f >= G.clean ? SAGE : C.muted} fontFamily={MONO} fontSize={15} fontWeight={700} letterSpacing={2}>
        {f >= G.clean ? 'CLEANED · EASIER TO FOLLOW' : 'MUDDY · ROOM + NOISE'}
      </text>
    </svg>
  );
};
const SpeechControls: React.FC<{f: number}> = ({f}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'flex-start'}}>
    <Toggle label="Native speech cleanup" on={1} />
    <Primary label="Process audio" press={pulse(f, G.clean, 14)} />
  </div>
);

// ---------------------------------------------------------------- the cards ----
const VIS: Record<ToolId, [React.FC<{f: number}>, React.FC<{f: number}>]> = {
  mixer: [Mixer, MixerControls],
  noise: [Noise, NoiseControls],
  mic: [Mic, MicControls],
  room: [Room, RoomControls],
  leveler: [Leveler, LevelerControls],
  loudness: [Loudness, LoudnessControls],
  beats: [Beats, BeatControls],
  speech: [Speech, SpeechControls],
};

export const Tools: React.FC<{f: number}> = ({f}) => {
  if (f < 470 || f > T.exit + 10) return null;
  const frameIn = eo(prog(f, 470, 486));
  const frameOut = eio(prog(f, T.exit, T.exit + 10));
  return (
    <div style={{position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, opacity: frameIn * (1 - frameOut), transform: `translateY(${(1 - frameIn) * 24 - frameOut * 20}px)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS.dialog, background: C.panel, border: `1px solid ${C.line}`}} />
      <div style={{position: 'absolute', left: 660, top: 30, bottom: 30, width: 1, background: C.line}} />
      {TOOLS.map((t, i) => {
        const a = prog(f, t.f - 4, t.f + 4);
        const b = prog(f, t.f + t.len - 4, t.f + t.len + 2);
        if (a <= 0 || b >= 1) return null;
        const ea = eo(a);
        const eb = eio(b);
        const [Vis, Ctl] = VIS[t.id];
        const flash = pulse(f, t.f, 10);
        return (
          <div key={t.id} style={{position: 'absolute', inset: 0, opacity: ea * (1 - eb)}}>
            <div style={{position: 'absolute', left: 44, top: 40, width: 580, transform: `translateX(${(1 - ea) * 40 - eb * 30}px)`}}>
              <ToolLabel name={t.name} index={String(i + 2).padStart(2, '0')} />
              <div style={{marginTop: 18, fontFamily: FONT, fontWeight: 650, fontSize: 44, lineHeight: 1.12, color: C.text, letterSpacing: '-0.01em'}}>{t.line}</div>
              <div style={{position: 'absolute', left: 0, top: 230}}>
                <Ctl f={f} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 700, top: 34, width: VW, height: VH, transform: `translateX(${(1 - ea) * 60 - eb * 40}px)`}}>
              <Vis f={f} />
            </div>
            <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS.dialog, border: `2px solid ${SAGE}`, opacity: 0.6 * flash}} />
          </div>
        );
      })}
    </div>
  );
};
