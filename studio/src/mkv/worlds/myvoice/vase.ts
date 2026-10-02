// Rubin's vase geometry, in medallion units (radius 1, centre 0,0, y down).
// w(y) = half-width of the vase at height y = distance from the centre line to each face's front edge.
// One curve, two readings: narrow where the profiles protrude (nose, lips, chin), wide where they recede.

const Y = [-1.15, -0.95, -0.8, -0.62, -0.5, -0.42, -0.32, -0.2, -0.14, -0.08, -0.02, 0.04, 0.1, 0.18, 0.29, 0.4, 0.5, 0.62, 0.8, 0.95, 1.15];

// "My voice" (neutral) + three generic characters. Abstract profiles, no real person.
export const PROFILES: number[][] = [
  [0.62, 0.47, 0.34, 0.26, 0.205, 0.24, 0.18, 0.065, 0.085, 0.175, 0.145, 0.185, 0.15, 0.235, 0.165, 0.27, 0.39, 0.43, 0.42, 0.35, 0.46],
  // A: strong brow, long nose, square chin
  [0.6, 0.44, 0.3, 0.22, 0.165, 0.23, 0.15, 0.03, 0.06, 0.19, 0.16, 0.2, 0.17, 0.22, 0.13, 0.25, 0.37, 0.41, 0.41, 0.34, 0.45],
  // B: soft — small nose, full lips, round chin
  [0.66, 0.5, 0.37, 0.29, 0.25, 0.27, 0.22, 0.12, 0.13, 0.175, 0.125, 0.165, 0.125, 0.215, 0.18, 0.29, 0.4, 0.44, 0.43, 0.36, 0.47],
  // C: tall forehead, aquiline nose, receding chin, slim neck
  [0.56, 0.4, 0.27, 0.21, 0.19, 0.235, 0.14, 0.05, 0.05, 0.16, 0.17, 0.205, 0.175, 0.25, 0.215, 0.3, 0.36, 0.38, 0.38, 0.33, 0.44],
];

export const blendProfile = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

// cubic Hermite through the knots (finite-difference tangents)
export const widthAt = (w: number[], y: number) => {
  const n = Y.length;
  if (y <= Y[0]) return w[0];
  if (y >= Y[n - 1]) return w[n - 1];
  let i = 0;
  while (Y[i + 1] < y) i++;
  const m = (k: number) => {
    const a = Math.max(0, k - 1);
    const b = Math.min(n - 1, k + 1);
    return (w[b] - w[a]) / (Y[b] - Y[a]);
  };
  const h = Y[i + 1] - Y[i];
  const t = (y - Y[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * w[i] + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * w[i + 1] + (t3 - t2) * h * m(i + 1);
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// The live-waveform ripple on the contour (same on both sides, so the vase stays symmetric).
// Quieter across the features (nose → chin) so the faces stay legible while the vase body sings.
export const ripple = (y: number, f: number, amp: number) =>
  amp *
  smooth(-0.92, -0.66, y) *
  (1 - smooth(0.74, 0.96, y)) *
  (1 - 0.65 * smooth(-0.34, -0.22, y) * (1 - smooth(0.3, 0.44, y))) *
  (0.62 * Math.sin(y * 29 - f * 0.33) + 0.38 * Math.sin(y * 57 + f * 0.21));

export const SAMPLES = 150;
export const contour = (w: number[], f: number, amp: number, y0 = -1.12, y1 = 1.12): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const y = y0 + ((y1 - y0) * i) / SAMPLES;
    pts.push([widthAt(w, y) + ripple(y, f, amp), y]);
  }
  return pts;
};

const n2 = (v: number) => v.toFixed(4);
// side = -1 → left face (x < -w), +1 → right face (x > w)
export const facePath = (pts: [number, number][], side: 1 | -1, dx = 0) => {
  const far = 1.8 * side;
  let d = `M${n2(far + dx)},${n2(pts[0][1])}`;
  for (const [w, y] of pts) d += `L${n2(side * w + dx)},${n2(y)}`;
  d += `L${n2(far + dx)},${n2(pts[pts.length - 1][1])}Z`;
  return d;
};

export const linePath = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
