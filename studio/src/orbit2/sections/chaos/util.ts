// Frame-math helpers shared by the chaos and turn acts (story frame g: 0 = chaos start, 720 = turn start).
export const CX = 960;
export const CY = 540;
export const TAU = Math.PI * 2;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = prog(x, a, b);
  return t * t * (3 - 2 * t);
};
export const ease = {
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoIn: (t: number) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => 1 - (1 - t) ** 3,
  cubicInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  quintInOut: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
  backOut: (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2,
};
// exponential decay after a moment (0 before it)
export const decay = (g: number, at: number, tau: number) => (g < at ? 0 : Math.exp(-(g - at) / tau));
// damped "settle" wobble after a landing: 1 + amp·e^(-t/tau)·cos(w t)
export const settle = (g: number, at: number, amp: number, tau = 5, w = 0.9) => (g < at ? 1 : 1 + amp * Math.exp(-(g - at) / tau) * Math.cos((g - at) * w));
export const rgba = (hex: string, a: number) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
export const mixHex = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  const v = [0, 1, 2].map((i) => Math.round(lerp(ch(a, i), ch(b, i), clamp(t))).toString(16).padStart(2, '0'));
  return `#${v.join('')}`;
};
