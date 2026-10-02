// One Droste level: the Training panel in the app's style (1600×900 design space). Its centre 800×450 window is
// left plain because the next, smaller copy of this same panel is drawn on top of it.
import React from 'react';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {mulberry32} from '../../timing';
import {Check, Mark} from './util';

const OR = ACCENT.training;
export const GATES = ['Prepare', 'Train', 'Listen'] as const;
export const CHECKS = ['Data', 'Model', 'Storage', 'Listening'] as const;
const BUTTON = ['Prepare training', 'Start training', 'Listen'];

const rnd = mulberry32(5150);
const WAVE = Array.from({length: 46}, (_, i) => {
  const x = i / 45;
  return 0.18 + 0.82 * Math.sin(Math.PI * x) ** 0.8 * (0.45 + 0.55 * rnd());
});

const GateIcon: React.FC<{gate: number; size: number; color: string}> = ({gate, size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {gate === 0 ? (
      <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    ) : gate === 1 ? (
      <path d="M5 19v-6M10 19V8M15 19v-9M20 19V5M3.5 20.5h17.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    ) : (
      <path d="M8 5.5v13l11-6.5z" fill={color} />
    )}
  </svg>
);

export const Level: React.FC<{k: number; lit: number[]; fog: number; rim: number}> = ({k, lit, fog, rim}) => {
  const gate = ((k % 3) + 3) % 3;
  const ringC = 2 * Math.PI * 104;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 44,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #1d1d1d 0%, #141414 52%, #0d0d0d 100%)',
        }}
      >
        {/* top band: app title + gate path */}
        <Mark size={60} style={{position: 'absolute', left: 56, top: 42}} />
        <div style={{position: 'absolute', left: 136, top: 44, fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.fg, letterSpacing: '-0.02em', lineHeight: 1}}>
          Training
        </div>
        <div style={{position: 'absolute', left: 138, top: 108, fontFamily: MONO, fontWeight: 500, fontSize: 19, letterSpacing: '0.2em', color: '#7a7a7a'}}>
          {GATES.map((g, i) => (
            <span key={g} style={{color: i === gate ? OR : undefined}}>
              {i ? '  ·  ' : ''}
              {g.toUpperCase()}
            </span>
          ))}
        </div>
        {/* gate tag */}
        <div style={{position: 'absolute', right: 56, top: 38, textAlign: 'right'}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.24em', color: OR}}>GATE 0{gate + 1}</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 70, letterSpacing: '-0.03em', color: C.fg, lineHeight: 1, marginTop: 8}}>
            {GATES[gate].toUpperCase()}
          </div>
        </div>
        {/* left column: gate checks */}
        <div style={{position: 'absolute', left: 56, top: 216, fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: '0.22em', color: '#7a7a7a'}}>
          GATE CHECKS
        </div>
        {CHECKS.map((c, i) => (
          <div key={c} style={{position: 'absolute', left: 56, top: 262 + i * 92, display: 'flex', alignItems: 'center', gap: 20}}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                boxSizing: 'border-box',
                border: `3px solid ${lit[i] > 0.5 ? C.green : '#3a3a3a'}`,
                background: `rgba(30,215,96,${lit[i]})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={28} color="#000" stroke={3.4} draw={lit[i]} />
            </div>
            <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 31, color: lit[i] > 0.5 ? C.fg : '#8a8a8a'}}>{c}</div>
          </div>
        ))}
        {/* right column: progress ring for this gate */}
        <svg width={260} height={260} style={{position: 'absolute', left: 1402 - 130, top: 440 - 130}}>
          <circle cx={130} cy={130} r={104} fill="none" stroke="#262626" strokeWidth={16} />
          <circle
            cx={130}
            cy={130}
            r={104}
            fill="none"
            stroke={OR}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={ringC}
            strokeDashoffset={ringC * (1 - (gate + 1) / 3)}
            transform="rotate(-90 130 130)"
          />
        </svg>
        <div style={{position: 'absolute', left: 1402 - 34, top: 440 - 34}}>
          <GateIcon gate={gate} size={68} color={gate === 2 ? C.green : C.fg} />
        </div>
        <div style={{position: 'absolute', left: 1402 - 150, width: 300, top: 590, textAlign: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.fg}}>{GATES[gate]}</div>
          <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 18, letterSpacing: '0.2em', color: '#7a7a7a', marginTop: 8}}>STEP {gate + 1}</div>
        </div>
        {/* bottom band: take waveform + primary button */}
        <svg width={1040} height={110} style={{position: 'absolute', left: 56, top: 746}}>
          {WAVE.map((v, i) => {
            const h = v * 104;
            return <rect key={i} x={i * 22.6} y={55 - h / 2} width={12} height={h} rx={6} fill={i / 45 < (gate + 1) / 3 ? OR : '#3a3a3a'} />;
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 1164,
            top: 760,
            width: 380,
            height: 80,
            borderRadius: 40,
            background: C.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 28,
            color: '#000',
          }}
        >
          <GateIcon gate={gate} size={30} color="#000" />
          {BUTTON[gate]}
        </div>
        {/* depth fog */}
        {fog > 0.002 ? <div style={{position: 'absolute', inset: 0, background: '#050403', opacity: fog}} /> : null}
      </div>
      {/* rim: the glowing frame edge that draws the tunnel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 44,
          border: `3px solid ${OR}`,
          opacity: rim,
          boxShadow: `0 0 0 2px rgba(255,122,47,0.25), 0 0 70px rgba(255,122,47,0.55), inset 0 0 40px rgba(255,122,47,0.25)`,
        }}
      />
    </>
  );
};
