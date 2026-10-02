// Clone Lab UI fragments: stepper + the four task panels (one main task at a time).
import React from 'react';
import {loadFont} from '@remotion/google-fonts/NotoKufiArabic';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {mulberry32} from '../../timing';
import {EXPO, IN_OUT, Icon, enter, mixColor, pop, ramp} from '../myvoice/kit';
import {CAL, READY_AR, READY_EN, REC, SETUP, TRAIN} from './timing';

const KUFI = loadFont('normal', {weights: ['600', '700'], subsets: ['arabic']}).fontFamily;
const ICE = ACCENT.clonelab;
const RED = '#FF4D5E';

export const PANEL = {x: 1056, y: 262, w: 744, h: 600};
const PAD = 44;
const IW = PANEL.w - PAD * 2;

const H: React.FC<{f: number; at: number; title: string; sub: string; right?: React.ReactNode}> = ({f, at, title, sub, right}) => (
  <div style={{position: 'absolute', left: PAD, top: 40, right: PAD, ...enter(f, at)}}>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: '-0.03em', color: '#fff'}}>{title}</div>
      {right}
    </div>
    <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 24, color: C.sub, marginTop: 8}}>{sub}</div>
  </div>
);

const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.sub, ...style}}>{children}</div>
);

// ---------- stepper ----------
export const Stepper: React.FC<{f: number}> = ({f}) => {
  const names = ['Set up', 'Record', 'Calibrate', 'Train'];
  const starts = [SETUP, REC, CAL, TRAIN];
  const W = [148, 160, 196, 132];
  return (
    <div style={{position: 'absolute', left: PANEL.x, top: 172, width: PANEL.w, height: 48, display: 'flex', alignItems: 'center'}}>
      {names.map((n, i) => {
        const active = ramp(f, starts[i] - 4, starts[i] + 4) * (i < 3 ? 1 - ramp(f, starts[i + 1] - 4, starts[i + 1] + 4) : 1);
        const done = i < 3 ? ramp(f, starts[i + 1] - 4, starts[i + 1] + 4) : 0;
        const s = 1 + 0.18 * Math.exp(-Math.max(0, f - starts[i]) / 6) * (f >= starts[i] ? 1 : 0);
        return (
          <React.Fragment key={n}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, width: W[i], flexShrink: 0}}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  flexShrink: 0,
                  border: `2px solid ${mixColor('#5b5b5b', C.green, Math.max(active, done))}`,
                  background: mixColor('#121212', C.green, active),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 19,
                  color: mixColor('#9a9a9a', '#000000', active),
                  transform: `scale(${s})`,
                  boxShadow: active > 0.5 ? `0 0 22px rgba(30,215,96,0.45)` : 'none',
                }}
              >
                {done > 0.5 ? <Icon name="check" size={22} color={C.green} stroke={3} /> : i + 1}
              </div>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 22, color: mixColor('#8a8a8a', '#ffffff', Math.max(active, done))}}>{n}</div>
            </div>
            {i < 3 ? <div style={{flex: 1, height: 2, margin: '0 14px', background: mixColor('#333333', C.green, done)}} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- 1 · Set up ----------
const meterLevel = (f: number) => {
  // a short input test: speech-like level bursts
  const t = f - SETUP - 40;
  if (t < 0) return 0;
  const v = 0.55 + 0.3 * Math.sin(t * 0.21) + 0.15 * Math.sin(t * 0.57 + 1.3);
  return Math.max(0, Math.min(1, v * ramp(f, SETUP + 40, SETUP + 52)));
};

const SetUp: React.FC<{f: number}> = ({f}) => {
  const lvl = meterLevel(f);
  const seg = 26;
  const pick = ramp(f, SETUP + 26, SETUP + 34);
  const ok = ramp(f, SETUP + 78, SETUP + 86);
  return (
    <>
      <H f={f} at={SETUP + 6} title="Set up" sub="Choose a microphone, then run a short input test." />
      <div style={{position: 'absolute', left: PAD, top: 200, width: IW, ...enter(f, SETUP + 14)}}>
        <Label>Microphone</Label>
        <div
          style={{
            marginTop: 12,
            height: 72,
            borderRadius: 14,
            background: C.control,
            border: `2px solid ${mixColor('#2a2a2a', ICE, pick * (1 - ramp(f, SETUP + 50, SETUP + 70)) + 0.25 * pick)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '0 22px',
          }}
        >
          <Icon name="mic" size={30} color="#fff" />
          <div style={{flex: 1, fontFamily: FONT, fontWeight: 600, fontSize: 27, color: '#fff'}}>Microphone (default)</div>
          <Icon name="chev" size={28} color={C.sub} />
        </div>
      </div>
      <div style={{position: 'absolute', left: PAD, top: 350, width: IW, ...enter(f, SETUP + 30)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Label>Input test</Label>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontWeight: 600, fontSize: 21, color: mixColor('#8a8a8a', C.green, ok)}}>
            <span style={{width: 10, height: 10, borderRadius: 5, background: mixColor('#5a5a5a', C.green, ok)}} />
            {ok > 0.5 ? 'Input looks good' : 'Listening…'}
          </div>
        </div>
        <div style={{marginTop: 16, display: 'flex', gap: 6}}>
          {Array.from({length: seg}, (_, i) => {
            const on = i / seg < lvl;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 4,
                  background: on ? C.green : '#2c2c2c',
                  opacity: on ? 1 : 0.9,
                  boxShadow: on && i / seg > lvl - 0.08 ? `0 0 14px rgba(30,215,96,0.6)` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

// ---------- 2 · Record ----------
const rnd = mulberry32(23);
const BARS = Array.from({length: 56}, (_, i) => {
  const u = i / 56;
  const env = 0.25 + 0.75 * Math.abs(Math.sin(u * 9.5 + 0.4)) * (0.6 + 0.4 * Math.sin(u * 3.1));
  return Math.max(0.08, Math.min(1, env * (0.55 + rnd() * 0.45)));
});

const Record: React.FC<{f: number}> = ({f}) => {
  const drawn = ramp(f, REC + 14, REC + 96, (t) => t) * BARS.length;
  const meters: [string, string, number, number][] = [
    ['Recorded', '#E8FBFF', 0.86, 18],
    ['Accepted', C.green, 0.68, 30],
    ['Excluded', '#7d7d7d', 0.16, 42],
  ];
  const dot = 0.6 + 0.4 * Math.cos(((f - REC) / 30) * Math.PI * 2);
  return (
    <>
      <H
        f={f}
        at={REC + 6}
        title="Record"
        sub="Read a few lines in your normal voice."
        right={
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.2em', color: RED}}>
            <span style={{width: 22, height: 22, borderRadius: 11, background: RED, boxShadow: `0 0 ${10 + dot * 16}px rgba(255,77,94,${0.4 + dot * 0.4})`, transform: `scale(${pop(f, REC + 8, 10, 220)})`}} />
            REC
          </div>
        }
      />
      <div style={{position: 'absolute', left: PAD, top: 186, width: IW, height: 110, display: 'flex', alignItems: 'center', gap: 5, ...enter(f, REC + 10)}}>
        {BARS.map((h, i) => {
          const vis = Math.min(1, Math.max(0, drawn - i));
          const head = Math.max(0, 1 - Math.abs(drawn - i) / 3);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 104 * h,
                borderRadius: 4,
                background: vis > 0 ? mixColor('#9fefff', '#ffffff', head) : '#2a2a2a',
                opacity: vis > 0 ? 0.35 + 0.65 * vis : 0.6,
                transform: `scaleY(${vis > 0 ? 0.3 + 0.7 * vis : 0.12})`,
              }}
            />
          );
        })}
      </div>
      {meters.map(([name, col, v, d], i) => {
        const fill = ramp(f, REC + d + 10, REC + d + 70, IN_OUT) * v;
        return (
          <div key={name} style={{position: 'absolute', left: PAD, top: 340 + i * 72, width: IW, display: 'flex', alignItems: 'center', gap: 26, ...enter(f, REC + d)}}>
            <div style={{width: 150, fontFamily: FONT, fontWeight: 700, fontSize: 25, color: '#fff'}}>{name}</div>
            <div style={{flex: 1, height: 16, borderRadius: 8, background: '#2a2a2a', overflow: 'hidden'}}>
              <div style={{width: '100%', height: '100%', borderRadius: 8, background: col, transform: `scaleX(${fill})`, transformOrigin: 'left center', boxShadow: `0 0 16px ${col}66`}} />
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- 3 · Calibrate ----------
const READY = [READY_EN, READY_AR];

const RangeRow: React.FC<{f: number; at: number; ready: number; label: React.ReactNode; rtl?: boolean; top: number}> = ({f, at, ready, label, rtl, top}) => {
  const fill = ramp(f, at, ready, IN_OUT);
  const r = pop(f, ready, 11, 220, 0.6);
  const chip = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        borderRadius: 18,
        background: C.green,
        color: '#000',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 20,
        opacity: Math.min(1, r * 1.5),
        transform: `scale(${0.6 + 0.4 * r})`,
        boxShadow: '0 0 24px rgba(30,215,96,0.5)',
      }}
    >
      <Icon name="check" size={18} color="#000" stroke={3.2} />
      Ready
    </div>
  );
  return (
    <div style={{position: 'absolute', left: PAD, top, width: IW, ...enter(f, at - 8)}}>
      <div style={{display: 'flex', flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', height: 50}}>
        {label}
        {chip}
      </div>
      <div style={{marginTop: 14, height: 18, borderRadius: 9, background: '#2a2a2a', overflow: 'hidden'}}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 9,
            background: mixColor(ICE, C.green, ramp(f, ready - 4, ready + 4)),
            transform: `scaleX(${fill})`,
            transformOrigin: rtl ? 'right center' : 'left center',
            boxShadow: `0 0 18px ${mixColor(ICE, C.green, ramp(f, ready - 4, ready + 4))}88`,
          }}
        />
      </div>
    </div>
  );
};

const Calibrate: React.FC<{f: number}> = ({f}) => (
  <>
    <H f={f} at={CAL + 4} title="Calibrate" sub="Normal range, per language." />
    <RangeRow f={f} at={CAL + 8} ready={READY[0]} top={210} label={<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, color: '#fff'}}>English</div>} />
    <RangeRow
      f={f}
      at={CAL + 14}
      ready={READY[1]}
      top={350}
      rtl
      label={
        <div dir="rtl" lang="ar" style={{fontFamily: KUFI, fontWeight: 700, fontSize: 32, color: '#fff', lineHeight: 1.4}}>
          العربية
        </div>
      }
    />
  </>
);

// ---------- 4 · Train ----------
const Train: React.FC<{f: number}> = ({f}) => {
  const glow = Math.exp(-Math.max(0, f - TRAIN) / 18);
  return (
    <>
      <H f={f} at={TRAIN + 2} title="Train" sub="Set up, recorded and calibrated." />
      {['Set up', 'Record', 'Calibrate'].map((n, i) => (
        <div key={n} style={{position: 'absolute', left: PAD, top: 196 + i * 66, display: 'flex', alignItems: 'center', gap: 18, ...enter(f, TRAIN + 4 + i * 3)}}>
          <div style={{width: 40, height: 40, borderRadius: 20, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="check" size={24} color="#000" stroke={3.2} />
          </div>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 27, color: '#fff'}}>{n}</div>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: PAD,
          top: 430,
          width: IW,
          height: 80,
          borderRadius: 40,
          background: C.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 28,
          color: '#000',
          boxShadow: `0 0 ${30 + glow * 50}px rgba(30,215,96,${0.35 + glow * 0.4})`,
          ...enter(f, TRAIN + 10),
        }}
      >
        Prepare training
        <Icon name="arrow" size={28} color="#000" stroke={2.8} />
      </div>
    </>
  );
};

// The panel: one task at a time. Each one expands out of its stair label (see World), holds, then hands over.
export const Panels: React.FC<{f: number; out: number}> = ({f, out}) => {
  const slots: [number, number, React.FC<{f: number}>][] = [
    [SETUP, REC, SetUp],
    [REC, CAL, Record],
    [CAL, TRAIN, Calibrate],
    [TRAIN, 1e9, Train],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.h,
        borderRadius: 26,
        background: C.surface,
        border: `1px solid ${C.selection}`,
        boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        opacity: ramp(f, SETUP + 8, SETUP + 16) * (1 - out),
        transform: `translateX(${out * 60}px)`,
      }}
    >
      {slots.map(([a, b, P], i) => {
        if (f < a - 2 || f > b + 12) return null;
        const leave = ramp(f, b - 6, b + 6, EXPO);
        return (
          <div key={i} style={{position: 'absolute', inset: 0, opacity: 1 - leave, transform: `translateX(${-leave * 50}px)`}}>
            <P f={f} />
          </div>
        );
      })}
    </div>
  );
};
