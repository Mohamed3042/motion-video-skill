// Small deterministic math kit: easing, springs, seeded PRNG, periodic Hermite paths.
export type V3 = [number, number, number];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);

// Damped spring step response 0 -> 1 (overshoots when zeta < 1). t in seconds.
export const spring = (t: number, freq = 2, zeta = 0.5) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};
// Decaying wobble that starts at 0 (for dips) - t in seconds.
export const wobble = (t: number, freq = 3, decay = 0.12) =>
  t <= 0 ? 0 : Math.exp(-t / decay) * Math.sin(2 * Math.PI * freq * t);

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Periodic cubic Hermite through timed keys (Catmull-Rom tangents on non-uniform times).
// Keys may set `hold` to force zero velocity (ease in / ease out) at that key.
export type Key = {t: number; v: number[]; hold?: boolean};
export const makePath = (keys: Key[], period: number) => {
  const n = keys.length;
  const at = (i: number) => {
    const k = keys[((i % n) + n) % n];
    const wrap = Math.floor(i / n) * period;
    return {t: k.t + wrap, v: k.v, hold: k.hold};
  };
  const tangent = (i: number) => {
    const k = at(i);
    if (k.hold) return k.v.map(() => 0);
    const a = at(i - 1);
    const b = at(i + 1);
    return k.v.map((_, d) => (b.v[d] - a.v[d]) / (b.t - a.t));
  };
  const tans = keys.map((_, i) => tangent(i));
  return (time: number): number[] => {
    let t = ((time % period) + period) % period;
    if (t < keys[0].t) t += period;
    let i = n - 1;
    for (let j = 0; j < n; j++) if (keys[j].t <= t) i = j;
    const t0 = keys[i].t;
    const k1 = at(i + 1);
    const t1 = k1.t;
    const h = t1 - t0;
    const s = (t - t0) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    const m0 = tans[i];
    const m1 = tans[(i + 1) % n];
    return keys[i].v.map((p0, d) => h00 * p0 + h10 * h * m0[d] + h01 * k1.v[d] + h11 * h * m1[d]);
  };
};
