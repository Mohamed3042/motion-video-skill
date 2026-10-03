// Small deterministic motion helpers shared by every act.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), // cubic in-out
  out: (t: number) => 1 - (1 - t) ** 3, // cubic out
  in: (t: number) => t * t * t,
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoInOut: (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  quintInOut: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
  backOut: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};
export type Ease = (t: number) => number;

// Keyframe track: kf(f, [[f0, v0], [f1, v1, ease?], ...]) — the ease on a key applies to the segment ARRIVING at it.
export const kf = (f: number, keys: Array<[number, number, Ease?]>): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    if (f <= f1) {
      const [f0, v0] = keys[i - 1];
      return lerp(v0, v1, (e ?? ease.inOut)((f - f0) / (f1 - f0)));
    }
  }
  return keys[keys.length - 1][1];
};

// Damped spring 0→1 starting at frame f0 (deterministic closed form; overshoot controlled by damping).
export const springAt = (f: number, f0: number, opts: {stiffness?: number; damping?: number} = {}) => {
  const t = (f - f0) / 60;
  if (t <= 0) return 0;
  const k = opts.stiffness ?? 170;
  const c = opts.damping ?? 18;
  const w0 = Math.sqrt(k);
  const zeta = c / (2 * w0);
  if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
};

// Smooth camera shake (sum of slow sines under a decaying envelope) — never per-frame jitter.
export const shake = (f: number, hits: Array<{f: number; amp: number}>, len = 20) => {
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const t = f - h.f;
    if (t < 0 || t >= len) continue;
    const env = (1 - t / len) ** 2;
    const k = h.f * 0.37;
    x += h.amp * env * (0.65 * Math.sin(t * 0.95 + k) + 0.35 * Math.sin(t * 1.73 + 2.1 * k));
    y += h.amp * env * (0.65 * Math.cos(t * 0.83 + 1.3 * k) + 0.35 * Math.sin(t * 2.11 + k));
  }
  return {x, y};
};
