// World layout + every motion curve, all pure functions of the (float) frame number.
import type {Font} from 'opentype.js';
import * as TL from './timeline';
import {layoutText, PlacedGlyph} from './text';
import {V3, Key, add3, clamp, easeIn, easeInOut, lerp, lerp3, makePath, smoothstep, spring, sub3, wobble} from './math';

export const R = 0.5; // hero sphere radius
export const TITLE_Z = -8;
export const RING_TEXT = 'EASING · SPRINGS · LOOPS · 3D · TYPE ·';

export type Placed = {g: PlacedGlyph; pos: V3; rotY: number};

export const buildLayout = (font: Font) => {
  // "MOTION" stands on the floor along +z (x = 0), facing the camera on the -x side.
  const m = layoutText(font, 'MOTION', {size: 2.1, depth: 0.62, bevel: 0.07});
  const z0 = 2.4;
  const motion: Placed[] = m.glyphs.map((g) => ({g, pos: [0, 0, z0 + g.x], rotY: -Math.PI / 2}));
  const motionInfo = m.glyphs.map((g) => ({z: z0 + g.x + (g.box.min.x + g.box.max.x) / 2, top: g.box.max.y}));

  // Title: two lines centred on x = 0 at z = TITLE_Z. Line 2 floats so its descenders kiss the floor.
  const L1 = layoutText(font, 'Claude Opus 5.5', {size: 1.55, depth: 0.44, bevel: 0.05});
  const L2 = layoutText(font, 'Motion Graphics Designer', {size: 1.0, depth: 0.3, bevel: 0.036});
  const periodR = 0.25;
  const gapP = 0.07;
  const w2 = L2.width + gapP + 2 * periodR;
  const base2 = -Math.min(...L2.glyphs.map((g) => g.box.min.y)) + 0.015;
  const top2 = Math.max(...L2.glyphs.map((g) => g.box.max.y));
  const base1 = base2 + top2 + 0.22 - Math.min(...L1.glyphs.map((g) => g.box.min.y));
  const x2 = -w2 / 2;
  const x1 = -L1.width / 2;
  const title: Placed[] = [
    ...L1.glyphs.map((g) => ({g, pos: [x1 + g.x, base1, TITLE_Z] as V3, rotY: 0})),
    ...L2.glyphs.map((g) => ({g, pos: [x2 + g.x, base2, TITLE_Z] as V3, rotY: 0})),
  ];
  const period: V3 = [x2 + L2.width + gapP + periodR, periodR, TITLE_Z];
  const titleTop = base1 + Math.max(...L1.glyphs.map((g) => g.box.max.y));

  // Ring of words around the hovering sphere, with a real gap the camera flies through.
  const rg = layoutText(font, RING_TEXT, {size: 0.98, depth: 0.24, bevel: 0.034});
  const gap = 2.6;
  const ringR = (rg.width + gap) / (Math.PI * 2);
  const ring = rg.glyphs.map((g) => {
    const cx = (g.box.min.x + g.box.max.x) / 2;
    return {g, cx, beta: (g.x + cx) / ringR};
  });
  const gapAngle = (rg.width + gap / 2) / ringR;

  const A: V3 = [0, 4.6, motionInfo[5].z + 1.9];
  return {motion, motionInfo, title, period, periodR, titleTop, ring, ringR, gapAngle, A};
};
export type Layout = ReturnType<typeof buildLayout>;

const F = TL.FPS;

export const makeChoreo = (L: Layout) => {
  const mi = L.motionInfo;
  const A = L.A;
  const P = L.period;
  const zHop = mi[0].z - 1.35;
  const vHop = (mi[0].z - zHop) / ((TL.LETTER_LAND[0] - TL.HOP) / F); // horizontal speed of the hop
  const rollT = (TL.HOP - TL.ROLL_START) / F;
  const mSlope = (vHop * rollT) / zHop;
  const R0: V3 = [P[0] - 1.9, 3.3, P[2] + 1.6]; // where the sphere re-forms from particles
  const reformT = (TL.PERIOD_LAND - TL.REFORM) / F;
  const gReform = 16;
  const vReform = (P[1] - R0[1] + 0.5 * gReform * reformT * reformT) / reformT;

  // Letter vertical offset (rise from the floor, dip under bounces, sink at the end of the beat).
  const letterY = (i: number, f: number) => {
    const g = L.motion[i].g;
    const h = g.box.max.y + 0.25;
    const rise = spring((f - TL.LETTER_RISE[i]) / F, 2.1, 0.42);
    const dip = -0.13 * wobble((f - TL.LETTER_LAND[i]) / F, 2.6, 0.14);
    const sinkStart = TL.MOTION_SINK + 4 * (5 - i);
    const antic = 0.05 * Math.sin(Math.PI * clamp((f - sinkStart) / 8));
    const sink = easeIn((f - sinkStart - 6) / 30) * (h + 0.4);
    return -h * (1 - rise) + dip + (f > sinkStart ? antic : 0) - sink;
  };
  const letterSquash = (i: number, f: number) => {
    // vertical stretch while rising fast, squash as it settles
    const v = (spring((f + 0.5 - TL.LETTER_RISE[i]) / F, 2.1, 0.42) - spring((f - 0.5 - TL.LETTER_RISE[i]) / F, 2.1, 0.42)) * F;
    return 1 + clamp(v * 0.05, -0.08, 0.12) - 0.05 * wobble((f - TL.LETTER_LAND[i]) / F, 2.6, 0.12);
  };

  const heroPos = (f: number): V3 => {
    if (f < TL.IMPACT) {
      const tau = (TL.IMPACT - f) / F;
      return [0, R + 30 * tau * tau, 0];
    }
    if (f < TL.BOUNCE2) {
      const s = (f - TL.IMPACT) / (TL.BOUNCE2 - TL.IMPACT);
      return [0, R + 4 * 1.05 * s * (1 - s), 0];
    }
    if (f < TL.SETTLE) {
      const s = (f - TL.BOUNCE2) / (TL.SETTLE - TL.BOUNCE2);
      return [0, R + 4 * 0.09 * s * (1 - s), 0];
    }
    if (f < TL.ROLL_START) return [0, R, 0];
    if (f < TL.HOP) {
      const u = (f - TL.ROLL_START) / (TL.HOP - TL.ROLL_START);
      const antic = u < 0.3 ? -0.09 * Math.pow(Math.sin((Math.PI * u) / 0.3), 2) : 0;
      return [0, R, zHop * u * u * (3 - mSlope + (mSlope - 2) * u) + antic];
    }
    if (f < TL.LETTER_LAND[0]) {
      const s = (f - TL.HOP) / (TL.LETTER_LAND[0] - TL.HOP);
      return [0, lerp(R, mi[0].top + R, s) + 4 * 0.85 * s * (1 - s), lerp(zHop, mi[0].z, s)];
    }
    for (let k = 0; k < 5; k++) {
      if (f < TL.LETTER_LAND[k + 1]) {
        const s = (f - TL.LETTER_LAND[k]) / (TL.LETTER_LAND[k + 1] - TL.LETTER_LAND[k]);
        const contact = (1 - smoothstep(0, 0.2, s)) * letterY(k, f); // ride the letter's dip
        return [0, lerp(mi[k].top, mi[k + 1].top, s) + R + 4 * 0.72 * s * (1 - s) + contact, lerp(mi[k].z, mi[k + 1].z, s)];
      }
    }
    if (f < TL.APEX) {
      const T = (TL.APEX - TL.LAUNCH) / F;
      const tau = (f - TL.LAUNCH) / F;
      const y0 = mi[5].top + R;
      const g = (2 * (A[1] - y0)) / (T * T);
      const zz = mi[5].z + (A[2] - mi[5].z) * (1 - Math.pow(1 - tau / T, 2));
      return [0, y0 + g * T * tau - 0.5 * g * tau * tau, zz];
    }
    if (f < TL.DROP) {
      const bob = 0.07 * Math.sin((2 * Math.PI * (f - TL.APEX)) / 240) * smoothstep(TL.APEX, TL.APEX + 50, f);
      return [A[0], A[1] + bob, A[2]];
    }
    if (f < TL.PERIOD_LAND) {
      const tau = Math.max(0, (f - TL.REFORM) / F);
      const s = tau / reformT;
      return [lerp(R0[0], P[0], s), R0[1] + vReform * tau - 0.5 * gReform * tau * tau, lerp(R0[2], P[2], s)];
    }
    if (f < TL.PERIOD_LAND + 18) {
      const s = (f - TL.PERIOD_LAND) / 18;
      return [P[0], P[1] + 4 * 0.09 * s * (1 - s), P[2]];
    }
    if (f < TL.SPHERE_RISE) return P;
    const u = (f - TL.SPHERE_RISE) / 100;
    return [P[0], P[1] + 8.5 * u * u, P[2]];
  };

  // Impacts drive squash & stretch (a = squash depth). Negative = takeoff squash before a jump.
  const IMPACTS: [number, number][] = [
    [TL.IMPACT, 0.36],
    [TL.BOUNCE2, 0.2],
    [TL.SETTLE, 0.06],
    [TL.HOP - 3, 0.12],
    ...TL.LETTER_LAND.map((f, i): [number, number] => [f, i === 5 ? 0.24 : 0.16]),
    [TL.PERIOD_LAND, 0.32],
    [TL.PERIOD_LAND + 18, 0.08],
    [TL.SPHERE_RISE - 6, 0.12],
  ];
  const squashAt = (f: number) => {
    let sy = 1;
    let pin = 0;
    for (const [fi, a] of IMPACTS) {
      const d = f - fi;
      if (d < 0 || d > 60) continue;
      sy -= 1.25 * a * smoothstep(0, 2.5, d) * Math.exp(-d / 5.5) * Math.cos((2 * Math.PI * d) / 15); // contact builds over ~40 ms
      pin = Math.max(pin, 1 - smoothstep(2, 7, d));
    }
    return {sy, pin};
  };

  const heroScale = (f: number) => {
    if (f < TL.SPLIT - 6) {
      let pulse = 0;
      for (let b = TL.RING_IN; b < TL.SPLIT; b += TL.BEAT) if (f >= b) pulse += 0.05 * Math.exp(-(f - b) / 8);
      return 1 + pulse;
    }
    if (f < TL.SPLIT + 14) {
      const u = (f - (TL.SPLIT - 6)) / 20;
      return u < 0.35 ? 1 + 0.1 * Math.sin((Math.PI * u) / 0.35 / 2) : 1.1 * (1 - easeIn((u - 0.35) / 0.65));
    }
    if (f < TL.REFORM) return 0;
    if (f > TL.SPHERE_RISE + 110) return 0;
    return clamp(0.25 + 0.75 * spring((f - TL.REFORM) / F, 3, 0.55), 0, 1.2);
  };
  const heroRadius = (f: number) => (f < TL.REFORM ? R : L.periodR);

  const tentHero = (f: number, half = 18): V3 => {
    let acc: V3 = [0, 0, 0];
    let wsum = 0;
    for (let k = -half; k <= half; k += 2) {
      const w = half + 1 - Math.abs(k);
      acc = add3(acc, heroPos(f + k).map((v) => v * w) as V3);
      wsum += w;
    }
    return acc.map((v) => v / wsum) as V3;
  };

  // ---------- camera (one continuous periodic path) ----------
  // Orbit around the hovering sphere: pull back and rise above the ring plane so the ring reads
  // as an ellipse, then come down to its level for the push through the gap.
  const orbit = (t: number): number[] => {
    const e = easeInOut((t - 9.3) / (14 - 9.3));
    const phi = lerp(-1.52, 0, e);
    const r = 5.6 + 4.6 * smoothstep(9.3, 11.0, t) - 0.9 * smoothstep(12.4, 14, t);
    const dy = -0.8 + 3.3 * smoothstep(9.3, 11.2, t) - 1.0 * smoothstep(12.8, 14.0, t);
    return [A[0] + r * Math.sin(phi), A[1] + dy, A[2] + r * Math.cos(phi), A[0], A[1] - 0.15, A[2], 34];
  };
  const k = (t: number, v: number[], hold = false): Key => ({t, v, hold});
  const camKeys: Key[] = [
    k(0, [-2.6, 0.62, 7.5, 0, 0.8, 0, 32]),
    k(1.2, [-2.9, 0.62, 6.8, 0, 0.78, 0.2, 32]),
    k(2.3, [-5.6, 1.2, 5.3, 0, 0.95, 2.4, 32]),
    k(3.3, [-8.1, 1.75, 5.7, 0, 1.45, 4.4, 32]),
    k(4.3, [-9.0, 1.95, 7.1, 0, 1.55, 6.6, 32]),
    k(5.3, [-9.2, 2.1, 8.7, 0, 1.65, 8.8, 32]),
    k(6.3, [-8.6, 2.6, 10.6, 0, 3.9, 11.7, 33]),
    k(7.3, [-6.1, 3.45, 11.9, A[0], A[1], A[2], 34]),
    orbitKey(9.3),
    orbitKey(10.2),
    orbitKey(11.0),
    orbitKey(11.8),
    orbitKey(12.6),
    orbitKey(13.3),
    k(14.0, orbit(14)),
    k(15.0, [0, 4.95, 15.9, 0, 4.45, 11.0, 34]),
    k(16.0, [0, 4.15, 13.5, 0, 3.0, 5.0, 34]),
    k(17.0, [0.05, 2.75, 9.4, 0, 1.75, -3, 33]),
    k(18.0, [0.04, 2.15, 7.85, 0, 1.3, TITLE_Z, 32]),
    k(22.0, [0, 1.9, 6.1, 0, 1.3, TITLE_Z, 32]),
    k(23.1, [-0.9, 1.55, 6.9, 0, 1.1, -5, 32]),
    k(24.2, [-2.35, 0.8, 7.45, 0, 0.82, -1, 32]),
  ];
  function orbitKey(t: number) {
    return k(t, orbit(t));
  }
  const camPath = makePath(camKeys, TL.DURATION / F);
  // The camera aims along the floor plane at the (smoothed) sphere while it rolls and skips,
  // and tilts up with it on the launch. Heights otherwise come from the keys.
  const followW = (t: number) => smoothstep(1.3, 2.3, t) * (1 - smoothstep(6.4, 7.3, t));
  const followY = (t: number) => smoothstep(5.35, 6.0, t) * (1 - smoothstep(6.5, 7.3, t));
  const camera = (f: number) => {
    const t = f / F;
    const v = camPath(t);
    const tgt: V3 = [v[3], v[4], v[5]];
    const w = followW(t);
    const wy = followY(t);
    if (w > 0 || wy > 0) {
      const h = tentHero(f);
      tgt[0] = lerp(tgt[0], h[0], w);
      tgt[2] = lerp(tgt[2], h[2] + 0.6, w);
      tgt[1] = lerp(tgt[1], h[1] - 0.2, wy);
    }
    return {pos: [v[0], v[1], v[2]] as V3, tgt, fov: v[6]};
  };

  // ---------- depth-of-field focus ----------
  const titleCenter: V3 = [0, 1.35, TITLE_Z];
  const focus = (f: number): V3 => {
    const cam = camera(f);
    const ahead = add3(cam.pos, sub3(cam.tgt, cam.pos).map((x) => x * (4 / Math.hypot(...sub3(cam.tgt, cam.pos)))) as V3);
    const hero = f < 100 ? lerp3([0, 0.7, 0], tentHero(f), smoothstep(30, 100, f)) : tentHero(f);
    // while the ring orbits, focus slightly in front of the sphere: front words crisp, back words soft
    const toCam = sub3(cam.pos, hero);
    const ringW = smoothstep(TL.RING_IN - 20, TL.RING_IN + 30, f) * (1 - smoothstep(TL.RING_OUT - 20, TL.RING_OUT + 10, f));
    let p = add3(hero, toCam.map((x) => (x / Math.hypot(...toCam)) * 1.3 * ringW) as V3);
    p = lerp3(p, ahead, smoothstep(TL.SPLIT - 10, TL.SPLIT + 50, f));
    p = lerp3(p, titleCenter, smoothstep(TL.FREEZE + 5, TL.DROP + 10, f));
    p = lerp3(p, [0, 0.7, 0], smoothstep(1400, 1490, f));
    return p;
  };
  // [bokehScale, focusRange]
  const bokeh = makePath(
    [k(0, [2.2, 3.2]), k(5, [2.6, 3.2]), k(7, [1.0, 9.0]), k(9.4, [1.0, 9.0]), k(11.2, [4.4, 4.6]), k(14.4, [3.4, 4.6]), k(15.6, [1.7, 5.5]), k(17.2, [2.0, 5.0]), k(18.3, [1.4, 4.0]), k(22, [1.4, 4.0]), k(24.2, [2.2, 3.2])],
    TL.DURATION / F,
  );

  // Ring rotation: phase chosen so the gap faces the camera when it flies through (~15.0 s).
  const ringSpin = (f: number) => {
    const t = f / F;
    const u = Math.max(0, t - 10);
    return -0.42 * u - 0.12 * Math.max(0, t - 13) * Math.max(0, t - 13); // accelerates into the push
  };
  const tCross = 15.0;
  const ringPhase = -L.gapAngle - ringSpin(tCross * F);
  const ringAngle = (f: number) => ringPhase + ringSpin(f);

  return {heroPos, squashAt, heroScale, heroRadius, letterY, letterSquash, camera, focus, bokeh: (f: number) => bokeh(f / F), ringAngle, R0, A, P};
};
export type Choreo = ReturnType<typeof makeChoreo>;
