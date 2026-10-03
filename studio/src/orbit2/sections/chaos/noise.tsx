// The noise field shared by both story acts, driven by the STORY frame g (0 = chaos start, 720 = turn start):
// storm (job-hunt clutter + dust) → one roaring cloud (536–716) → falls into ordered orbit rings around the coral
// point (722–806) → inner rings collapse into the logo ring (804–838); outer dust rings stay as the planet's orbit field.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {ASPECT, RING, T0, TILT, k512, logoBox, ringCenter} from '../turn/geom';
import {LINES, PINGS, SQUEEZE} from './timing';
import {CX, CY, TAU, clamp, ease, lerp, mixHex, prog, rgba, smooth} from './util';

export const StoryOffset = createContext(0);
export const useStoryFrame = () => useSectionFrame() + useContext(StoryOffset);

// ---------------------------------------------------------------- orbit maths
const CLOUD_ASPECT = 0.6;
const R0 = [270, 380, 500, 640, 800, 980];
const OMEGA = [0.03, 0.022, 0.017, 0.013, 0.009, 0.007]; // inner rings turn faster (Kepler-ish)
const PHASE = [0.3, 1.9, 0.8, 2.6, 1.2, 0.1];
const A0 = SQUEEZE; // cloud spin reference
const RA = T0; // chaotic spin → one direction over [RA, RB]
const RB = T0 + 42;

// inner rings (0–3) collapse onto the logo ring; outer ones follow the logo box after the lock
export const ringRadius = (k: number, g: number) => {
  const s = k512(logoBox(g)) * 512;
  if (k >= 4) return (R0[k] * s) / 440;
  const c = ease.cubicIn(prog(g, T0 + 84 + 5 * k, T0 + 116));
  return lerp(R0[k], (RING.a * s) / 512, c);
};
const thetaInt = (th0: number, w: number, W: number, g: number) => {
  if (g <= RA) return th0 + w * (g - A0);
  const base = th0 + w * (RA - A0);
  if (g <= RB) {
    const t = g - RA;
    return base + w * t + ((W - w) * t * t) / (2 * (RB - RA));
  }
  return base + (w * (RB - RA)) / 1 + ((W - w) * (RB - RA)) / 2 + W * (g - RB);
};
const thetaRing = (k: number, slot: number, n: number, g: number) => (TAU * slot) / n + OMEGA[k] * (g - T0) + PHASE[k];
const wrap = (a: number) => a - TAU * Math.round(a / TAU);

type Orb = {rc: number; th0: number; w: number; k: number; slot: number; n: number; delta: number; tl: number; ph: number};
const makeOrb = (rnd: () => number, rc: number, k: number, slot: number, n: number, tl: number): Orb => {
  const th0 = rnd() * TAU;
  const w = (rnd() < 0.5 ? -1 : 1) * (0.012 + 0.05 * rnd());
  const ref = T0 + 120;
  return {rc, th0, w, k, slot, n, tl, ph: rnd() * TAU, delta: wrap(thetaRing(k, slot, n, ref) - thetaInt(th0, w, OMEGA[k], ref))};
};
// position on the cloud → ring path; returns [x, y, T, sinθ]
const orbit = (o: Orb, g: number): [number, number, number, number] => {
  const T = ease.cubicInOut(prog(g, T0 + 2 + o.tl, T0 + 66 + o.tl));
  const th = thetaInt(o.th0, o.w, OMEGA[o.k], g) + T * o.delta;
  const rc = o.rc * (1 + 0.08 * Math.sin(0.11 * g + o.ph) + 0.05 * Math.sin(0.37 * g + 2 * o.ph));
  const r = lerp(rc, ringRadius(o.k, g), T);
  const asp = lerp(CLOUD_ASPECT, ASPECT, T);
  const tl = TILT * T;
  const u = r * Math.cos(th);
  const v = r * Math.sin(th) * asp;
  const [rx, ry] = g > T0 + 60 ? ringCenter(g) : [CX, CY];
  const cx = lerp(CX, rx, T);
  const cy = lerp(CY, ry, T);
  return [cx + u * Math.cos(tl) - v * Math.sin(tl), cy + u * Math.sin(tl) + v * Math.cos(tl), T, Math.sin(th)];
};

// smooth storm camera: sum of sines, amplitude grows with the storm, roars in the cloud, settles at the ignite
export const camJitter = (g: number) => {
  const a = (1.5 + 7 * smooth(30, 536, g) + 7 * smooth(560, 640, g)) * (1 - smooth(T0 - 6, T0 + 30, g));
  return {
    x: a * (Math.sin(0.071 * g) + 0.6 * Math.sin(0.113 * g + 1.3) + 0.35 * Math.sin(0.191 * g + 2.1)),
    y: a * (Math.sin(0.083 * g + 0.7) + 0.55 * Math.sin(0.127 * g + 2.4) + 0.3 * Math.sin(0.173 * g + 0.4)),
    rot: a * 0.045 * (Math.sin(0.057 * g + 0.2) + 0.5 * Math.sin(0.141 * g + 1.1)),
  };
};

// ---------------------------------------------------------------- the clutter
export type Kind = 'tab' | 'card' | 'cv' | 'toast' | 'q' | 'chip' | 'pill';
type Item = {
  kind: Kind;
  text: string;
  sub?: string;
  tone?: string;
  spawn: number;
  from?: [number, number];
  to: [number, number];
  depth: number;
  rot: number;
  v: [number, number];
  ph: number[];
  lag: number;
  orb: Orb;
  hook?: boolean;
};

export const AMBER = C.warning;
export const RED = C.red;
export const GREY = '#a7a9b6';
export const TABS = ['Job search — results', 'Careers | Openings', 'Listing details', 'Apply — step 2 of 5', 'Untitled', 'Role overview', 'Sign in to continue', 'Job alert settings', 'Saved jobs', 'Company careers', 'Similar roles', 'Page not found', 'Opening — details', 'Results · page 7', 'New tab', 'Search results'];
export const ROLES = ['Data Analyst', 'Project Coordinator', 'QA Engineer', 'Operations Lead', 'Product Designer', 'Junior Developer', 'Content Writer', 'Support Specialist', 'Business Analyst', 'Sales Associate'];
export const COMPANY = ['Company confidential', 'Hiring company', 'Recruiter listing', 'Location: unclear'];
export const STATUS: Array<[string, string]> = [['Posted 30+ days ago', AMBER], ['Is this still open?', GREY], ['Closed', RED], ['Reposted', GREY], ['Expired', RED], ['No salary listed', GREY]];
export const PILLS: Array<[string, string]> = [['Is this still open?', GREY], ['Closed', RED], ['Posted 30+ days ago', AMBER], ['Reposted', GREY], ['Expired', RED], ['Still accepting?', GREY], ['Closed', RED], ['Posted 30+ days ago', AMBER], ['Is this still open?', GREY], ['Last checked: ?', AMBER]];
export const QUAL = ['Required?', 'Preferred?', 'Senior?', 'Entry level?', 'Must have?', 'Nice to have?', 'Years: ?', 'Degree?'];
export const CVS = ['CV_final_v7.docx', 'CV_final_FINAL.pdf', 'CV_final_v2_edit.docx', 'resume_NEW(3).pdf', 'CV_final_final.docx', 'CV_copy_copy.pdf', 'CV_v4_USE_THIS.docx', 'CV_FINAL_real.pdf', 'resume_old.docx', 'CV_draft.pdf'];
export const SKILLS = ['Python?', 'SQL?', 'Cloud?', 'Excel?', 'Design?', 'AI?', 'Docker?', 'Data?'];
export const TOASTS: Array<[string, string]> = [['New job alert', 'A listing matches your search'], ['Reminder', 'Did you follow up?'], ['Listing updated', 'Requirements changed'], ['Job alert', 'Similar roles posted'], ['Application portal', 'Session expired'], ['Saved search', 'More results available'], ['Listing closed', 'This posting was removed'], ['Profile reminder', 'Is your CV up to date?']];

const ITEMS: Item[] = (() => {
  const rnd = mulberry32(90210);
  const out: Item[] = [];
  const pos = (cx: number, cy: number, rx: number, ry: number): [number, number] => {
    for (;;) {
      const x = cx + (rnd() * 2 - 1) * rx;
      const y = cy + (rnd() * 2 - 1) * ry;
      const inBand = Math.abs(x - CX) < 620 && Math.abs(y - CY) < 120;
      if (!inBand || rnd() < 0.15) return [x, y];
    }
  };
  const add = (kind: Kind, text: string, spawn: number, to: [number, number], depth: number, extra: Partial<Item> = {}) =>
    out.push({kind, text, spawn, to, depth, rot: (rnd() * 2 - 1) * 9, v: [(rnd() * 2 - 1) * 0.28, (rnd() * 2 - 1) * 0.2], ph: [0, 1, 2, 3].map(() => rnd() * TAU), lag: rnd() * 14, orb: null as unknown as Orb, ...extra});

  // notification toasts, one per ping
  PINGS.forEach((p, i) => {
    const [t, s] = TOASTS[i % TOASTS.length];
    if (i === 0) add('toast', t, p.f, [CX, CY], 1.5, {sub: s, hook: true, rot: 0});
    else add('toast', t, p.f, [p.x, p.y], 0.55 + 0.35 * rnd(), {sub: s});
  });
  // a burst for every kinetic line
  const burst = (k: number, n: number, mk: (j: number) => [Kind, string, string?, string?]) => {
    for (let j = 0; j < n; j++) {
      const [kind, text, sub, tone] = mk(j);
      const a = rnd() * TAU;
      const to: [number, number] = [CX + Math.cos(a) * (430 + 470 * rnd()), CY + Math.sin(a) * (230 + 260 * rnd())];
      add(kind, text, LINES[k].f - 1 + j * 0.6, to, 0.55 + 0.5 * rnd(), {from: [CX + (rnd() - 0.5) * 300, CY + (rnd() - 0.5) * 60], sub, tone});
    }
  };
  burst(0, 16, (j) => ['tab', TABS[j % TABS.length]]);
  burst(1, 10, (j) => ['card', ROLES[j % ROLES.length], COMPANY[j % COMPANY.length], String(j % STATUS.length)]);
  burst(2, 10, (j) => ['pill', PILLS[j][0], undefined, PILLS[j][1]]);
  burst(3, 14, (j) => (j < 8 ? ['chip', QUAL[j]] : ['q', '?']));
  burst(4, 10, (j) => ['cv', CVS[j]]);
  burst(5, 14, (j) => (j < 8 ? ['chip', SKILLS[j]] : ['q', '?']));
  // background trickle
  const mix: Kind[] = ['tab', 'card', 'cv', 'q', 'tab', 'pill', 'q', 'card', 'cv', 'tab'];
  for (let j = 0; j < 40; j++) {
    const kind = mix[j % mix.length];
    const spawn = 40 + 500 * (j / 40) ** 0.8 + rnd() * 10;
    const text = kind === 'tab' ? TABS[(j * 5) % TABS.length] : kind === 'card' ? ROLES[(j * 3) % ROLES.length] : kind === 'cv' ? CVS[(j * 7) % CVS.length] : kind === 'pill' ? PILLS[j % PILLS.length][0] : '?';
    add(kind, text, spawn, pos(CX, CY, 900, 480), 0.4 + 0.35 * rnd(), {sub: COMPANY[j % COMPANY.length], tone: kind === 'card' ? String(j % STATUS.length) : PILLS[j % PILLS.length][1]});
  }
  // orbit assignment: rings 0–3, evenly spaced
  const counts = [0, 0, 0, 0];
  const ringOf = out.map((_, i) => [0, 1, 2, 3, 1, 2, 3, 2, 3, 3][i % 10]);
  ringOf.forEach((k) => counts[k]++);
  const seen = [0, 0, 0, 0];
  out.forEach((it, i) => {
    const k = ringOf[i];
    it.orb = makeOrb(rnd, 60 + 380 * rnd() ** 0.8, k, seen[k]++, counts[k], 4 * k + rnd() * 10);
  });
  return out.sort((a, b) => a.depth - b.depth);
})();

// ---------------------------------------------------------------- item looks (b = 0 noise palette → 1 brand)
const pal = (b: number) => ({
  bg: mixHex('#141a2e', C.panel, b),
  bg2: mixHex('#1c2238', C.raised, b),
  line: mixHex('#2c3352', C.line, b),
  ink: mixHex('#e6e2d6', C.ink, b),
  mute: mixHex('#8d909e', C.muted, b),
});
const tone = (t: string, b: number) => mixHex(t, C.sky, b);

const Bell: React.FC<{c: string}> = ({c}) => (
  <svg width={22} height={22} viewBox="0 0 24 24">
    <path d="M12 3a5.5 5.5 0 0 0-5.5 5.5v3.6L4.6 15.6h14.8l-1.9-3.5V8.5A5.5 5.5 0 0 0 12 3z" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
    <path d="M9.8 18.2a2.3 2.3 0 0 0 4.4 0" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

export const ItemView: React.FC<{it: Pick<Item, 'kind' | 'text' | 'sub' | 'tone'>; b: number}> = ({it, b}) => {
  const p = pal(b);
  switch (it.kind) {
    case 'tab':
      return (
        <div style={{width: 250, height: 40, borderRadius: '11px 11px 0 0', background: p.bg2, border: `1px solid ${p.line}`, borderBottom: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', fontFamily: FONT, fontSize: 16, color: p.ink}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: mixHex(['#8a8f9e', '#c9a86a', '#7c93c9', '#b07a8a', '#7fb0a0'][it.text.length % 5], C.coral, b), flexShrink: 0}} />
          <div style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.text}</div>
          <div style={{color: p.mute, fontSize: 17}}>×</div>
        </div>
      );
    case 'card': {
      const [st, tc] = STATUS[Number(it.tone ?? 0) % STATUS.length];
      return (
        <div style={{width: 300, padding: '16px 18px', borderRadius: 12, background: p.bg, border: `1px solid ${p.line}`, fontFamily: FONT, color: p.ink, boxShadow: '0 18px 40px rgba(0,0,0,0.35)'}}>
          <div style={{fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em'}}>{it.text}</div>
          <div style={{fontSize: 14, color: p.mute, marginTop: 4}}>{it.sub}</div>
          <div style={{display: 'flex', gap: 8, marginTop: 14}}>
            <div style={{height: 8, width: 90, borderRadius: 4, background: p.line}} />
            <div style={{height: 8, width: 50, borderRadius: 4, background: p.line}} />
          </div>
          <div style={{display: 'inline-block', marginTop: 12, padding: '5px 12px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: tone(tc, b), background: rgba(tone(tc, b), 0.13), border: `1px solid ${rgba(tone(tc, b), 0.45)}`}}>{st}</div>
        </div>
      );
    }
    case 'pill': {
      const tc = tone(it.tone ?? GREY, b);
      return <div style={{padding: '7px 16px', borderRadius: 18, fontFamily: FONT, fontSize: 19, fontWeight: 600, color: tc, background: rgba(tc, 0.13), border: `1px solid ${rgba(tc, 0.5)}`, whiteSpace: 'nowrap'}}>{it.text}</div>;
    }
    case 'chip':
      return <div style={{padding: '8px 18px', borderRadius: 9, fontFamily: FONT, fontSize: 21, fontWeight: 500, color: p.ink, background: p.bg2, border: `1px solid ${p.line}`, whiteSpace: 'nowrap'}}>{it.text}</div>;
    case 'cv': {
      const pdf = it.text.endsWith('.pdf');
      const band = mixHex(pdf ? '#e5646a' : '#5b7ee8', pdf ? C.coral : C.sky, b);
      return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
          <svg width={72} height={90} viewBox="0 0 72 90">
            <path d="M6 0h42l24 24v60a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z" fill={mixHex('#d9d5c9', '#dfe8ff', b)} />
            <path d="M48 0v18a6 6 0 0 0 6 6h18z" fill={mixHex('#a9a59a', '#aec5ef', b)} />
            {[34, 42, 50].map((y) => (
              <rect key={y} x={10} y={y} width={y === 50 ? 30 : 46} height={4} rx={2} fill="#9c9a92" opacity={0.6} />
            ))}
            <rect x={6} y={62} width={44} height={17} rx={3} fill={band} />
            <text x={28} y={75} textAnchor="middle" fontFamily={MONO} fontSize={11} fontWeight={700} fill="#fff">
              {pdf ? 'PDF' : 'DOCX'}
            </text>
          </svg>
          <div style={{fontFamily: MONO, fontSize: 16, color: p.ink, whiteSpace: 'nowrap', background: rgba('#05091f', 0.6), padding: '2px 8px', borderRadius: 5}}>{it.text}</div>
        </div>
      );
    }
    case 'toast':
      return (
        <div style={{width: 380, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: p.bg2, border: `1px solid ${p.line}`, boxShadow: '0 20px 50px rgba(0,0,0,0.45)', fontFamily: FONT}}>
          <div style={{position: 'relative', width: 42, height: 42, borderRadius: 21, background: mixHex('#2a3050', C.cobalt, b), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <Bell c={p.ink} />
            <div style={{position: 'absolute', right: 1, top: 1, width: 11, height: 11, borderRadius: 6, background: mixHex('#ff5a5f', C.coral, b), border: `2px solid ${p.bg2}`}} />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 18, fontWeight: 600, color: p.ink}}>{it.text}</div>
            <div style={{fontSize: 15, color: p.mute, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.sub}</div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 12, color: p.mute, alignSelf: 'flex-start'}}>now</div>
        </div>
      );
    case 'q':
    default:
      return <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 120, lineHeight: 1, color: mixHex(it.text.length % 2 ? '#e6e2d6' : AMBER, C.sky, b), opacity: 0.85}}>?</div>;
  }
};

// kinetic-line shoves: each landing pushes the clutter outward
const shove = (g: number, x: number, y: number) => {
  let dx = 0;
  let dy = 0;
  const d = Math.hypot(x - CX, (y - CY) * 1.6) + 1;
  for (const l of LINES) {
    if (g < l.f) break;
    const k = 90 * ease.expoOut(prog(g, l.f, l.f + 24)) * Math.exp(-d / 700);
    dx += ((x - CX) / d) * k;
    dy += ((y - CY) / d) * k * 0.7;
  }
  return [dx, dy];
};

const itemState = (it: Item, g: number) => {
  const age = g - it.spawn;
  if (age < 0) return null;
  // storm
  const fly = it.from ? ease.expoOut(prog(age, 0, 26)) : 1;
  let bx = it.from ? lerp(it.from[0], it.to[0], fly) : it.to[0];
  let by = it.from ? lerp(it.from[1], it.to[1], fly) : it.to[1];
  let depth = it.depth;
  if (it.hook) {
    // the hook toast holds centre stage, then gets knocked into the storm by the first line
    const kn = ease.cubicInOut(prog(g, LINES[0].f - 6, LINES[0].f + 16));
    bx = lerp(bx, 640, kn);
    by = lerp(by, 300, kn);
    depth = lerp(1.5, 0.75, kn);
  }
  const A = 8 + 26 * smooth(30, 536, g);
  const [sx, sy] = it.hook ? [0, 0] : shove(g, bx, by);
  const x = bx + sx + it.v[0] * age + A * (Math.sin(0.031 * g + it.ph[0]) + 0.5 * Math.sin(0.077 * g + it.ph[1]));
  const y = by + sy + it.v[1] * age + A * (Math.cos(0.027 * g + it.ph[2]) + 0.5 * Math.sin(0.069 * g + it.ph[3]));
  const pop = it.hook ? ease.backOut(prog(age, 0, 9)) : ease.backOut(prog(age, 0, 10));
  const sStorm = depth * lerp(0.35, 1, pop);
  const oStorm = clamp(age / 4) * (0.35 + 0.65 * clamp((depth - 0.35) / 0.65));
  const rStorm = it.rot * (it.hook ? 0 : 1) + 4 * Math.sin(0.023 * g + it.ph[1]);
  // cloud + orbit
  const E = ease.cubicIn(prog(g, SQUEEZE + it.lag * 0.6, 572));
  const [ox, oy, T, sn] = orbit(it.orb, g);
  const collapse = prog(g, T0 + 92 + it.orb.k * 3, T0 + 116);
  const sCloud = 0.3 + 0.18 * it.depth;
  const scale = lerp(lerp(sStorm, sCloud, E), 0.34 * (1 + 0.22 * sn), T) * (1 - 0.75 * collapse);
  const op = lerp(oStorm, 0.9, E) * lerp(1, 0.7 + 0.3 * sn, T) * (1 - ease.cubicIn(collapse));
  const rot = lerp(rStorm + E * 50 * Math.sin(0.06 * g + it.ph[2]), 0, T);
  return {x: lerp(x, ox, E), y: lerp(y, oy, E), scale, op, rot, b: T};
};

// ---------------------------------------------------------------- dust (one SVG, ≤ 1,000 marks)
type Dust = {x: number; y: number; vx: number; vy: number; r: number; a: number; spawn: number; fl: number; ph: number; lag: number; orb: Orb};
const NDUST = 1000;
const DUST: Dust[] = (() => {
  const rnd = mulberry32(777);
  const ks: number[] = [];
  for (let i = 0; i < NDUST; i++) ks.push(i % 20 < 9 ? i % 4 : 4 + (i % 2));
  const counts = [0, 0, 0, 0, 0, 0];
  ks.forEach((k) => counts[k]++);
  const seen = [0, 0, 0, 0, 0, 0];
  return ks.map((k) => {
    const big = rnd() < 0.05;
    return {
      x: rnd() * 2120 - 100,
      y: rnd() * 1240 - 80,
      vx: (rnd() * 2 - 1) * 0.7 + 0.25,
      vy: (rnd() * 2 - 1) * 0.45,
      r: big ? 3 + 4 * rnd() : 0.7 + 1.8 * rnd() ** 2,
      a: big ? 0.12 + 0.12 * rnd() : 0.25 + 0.5 * rnd(),
      spawn: 20 + 520 * rnd() ** 1.3,
      fl: 0.05 + 0.25 * rnd(),
      ph: rnd() * TAU,
      lag: rnd() * 18,
      orb: makeOrb(rnd, 30 + 470 * rnd() ** 0.75, k, seen[k]++, counts[k], k * 3 + rnd() * 8),
    };
  });
})();

const DustLayer: React.FC<{g: number}> = ({g}) => {
  const storm = smooth(20, 300, g);
  const marks: React.ReactNode[] = [];
  const settled = smooth(T0 + 100, T0 + 150, g);
  const benefitDim = 1 - 0.45 * smooth(T0 + 230, T0 + 270, g);
  for (let i = 0; i < NDUST; i++) {
    const d = DUST[i];
    const age = g - d.spawn;
    if (age < 0) continue;
    const E = ease.cubicIn(prog(g, SQUEEZE - 6 + d.lag, 574));
    const W = 2120;
    const Hh = 1240;
    const sx = ((((d.x + d.vx * g + 18 * Math.sin(0.02 * g + d.ph)) % W) + W) % W) - 100;
    const sy = ((((d.y + d.vy * g + 14 * Math.cos(0.017 * g + d.ph)) % Hh) + Hh) % Hh) - 80;
    let x = sx;
    let y = sy;
    let T = 0;
    let sn = 0;
    if (E > 0) {
      const o = orbit(d.orb, g);
      x = lerp(sx, o[0], E);
      y = lerp(sy, o[1], E);
      T = o[2];
      sn = o[3];
    }
    const inner = d.orb.k < 4;
    const collapse = inner ? prog(g, T0 + 96, T0 + 122) : 0;
    const flick = 0.65 + 0.35 * Math.sin(d.fl * g + d.ph);
    let op = d.a * clamp(age / 12) * lerp(storm * flick, 1, E) * (1 - collapse);
    op *= lerp(1, (0.55 + 0.45 * (0.5 + 0.5 * sn)) * lerp(1, 0.75 * benefitDim, settled), T);
    if (op < 0.02) continue;
    const r = d.r * lerp(1, 0.9 + 0.5 * (0.5 + 0.5 * sn), T) * (1 + 0.6 * E * (1 - T));
    const col = T > 0 ? mixHex('#e8e3d4', i % 7 === 0 ? C.coral : i % 3 === 0 ? C.sky : C.ink, T) : '#e8e3d4';
    marks.push(<circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill={col} opacity={op.toFixed(3)} />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {marks}
    </svg>
  );
};

// thin ellipses that draw in as the clutter settles into order, then collapse with it
const RingLines: React.FC<{g: number}> = ({g}) => {
  const vis = smooth(T0 + 30, T0 + 62, g);
  if (vis <= 0) return null;
  const [cx, cy] = ringCenter(g);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      {R0.map((_, k) => {
        const r = ringRadius(k, g);
        const draw = ease.cubicOut(prog(g, T0 + 30 + 5 * k, T0 + 74 + 5 * k));
        const fade = k < 4 ? 1 - prog(g, T0 + 104, T0 + 122) : lerp(1, 0.35, smooth(T0 + 110, T0 + 150, g)) * (1 - 0.5 * smooth(T0 + 230, T0 + 270, g));
        const c = Math.PI * (r + r * ASPECT) * 1.02;
        return (
          <ellipse
            key={k}
            cx={cx}
            cy={cy}
            rx={r}
            ry={r * ASPECT}
            transform={`rotate(${RING.tilt} ${cx} ${cy})`}
            fill="none"
            stroke={k % 2 ? C.sky : C.muted}
            strokeWidth={k < 4 ? 1.4 : 1.1}
            strokeDasharray={`${c * draw} ${c}`}
            strokeDashoffset={-((g * 1.5 + k * 300) % c)}
            opacity={vis * fade * (k < 4 ? 0.42 : 0.3)}
          />
        );
      })}
    </svg>
  );
};

export const NoiseField: React.FC = () => {
  const g = useStoryFrame();
  return (
    <AbsoluteFill>
      <RingLines g={g} />
      <DustLayer g={g} />
      {ITEMS.map((it, i) => {
        const s = itemState(it, g);
        if (!s || s.op < 0.01 || s.scale < 0.02) return null;
        return (
          <div key={i} style={{position: 'absolute', left: s.x, top: s.y, opacity: s.op, transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${s.scale})`}}>
            <ItemView it={it} b={s.b} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Base colour + haze: near-black storm → brand navy at the ignite. Flat navy around the logo once it forms.
export const Backdrop: React.FC = () => {
  const g = useStoryFrame();
  const navy = smooth(T0, T0 + 90, g);
  const haze = smooth(200, 560, g) * (1 - smooth(T0, T0 + 60, g));
  const roar = smooth(560, 600, g) * (1 - smooth(T0 - 4, T0 + 20, g));
  const flick = 0.85 + 0.15 * Math.sin(0.9 * g) * Math.sin(0.37 * g);
  return (
    <AbsoluteFill style={{background: mixHex('#020617', C.bg, navy)}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(170,170,190,0.10) 0%, rgba(120,120,150,0.04) 45%, rgba(0,0,0,0) 75%)', opacity: haze * flick}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 34% 30% at 50% 52%, rgba(225,215,195,0.16) 0%, rgba(150,140,160,0.06) 50%, rgba(0,0,0,0) 80%)', opacity: roar * flick}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 70% at 50% 46%, rgba(0,0,0,0) 58%, rgba(1,4,22,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};
