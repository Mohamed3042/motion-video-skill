// Acts 1–2 (chaos + turn) share ONE continuous camera and one world: the planet's site (world origin).
// Story frame g = global frame (chaos local f = g; turn local f = g − 720). Plain TS (imported by shot.ts).
//
// Act 1: the camera flies down −z through a storm of job-hunt debris toward the origin; each kinetic line is
// giant type placed on the path so it slams in on its hit and is flown through just before the next one.
// At the squeeze the storm compresses into a cloud at the origin; the headline holds; the roar implodes.
// Act 2: the coral point ignites at the origin, the debris falls into orbital rings, the camera pulls back and
// up to watch them form, then settles into the LOGO view (render ≡ PNG); relayout; benefits; the dive.
import {add, clamp, cross, lerp, lerp3, norm, oneToOne, smooth, smoother, sub, type Shot, type V3} from '../../engine/math.ts';
import {LOGO_CAM, LOGO_D, LOGO_FOV, satPos} from '../../shell/orbit.ts';
import {HEADLINE, LINES, SQUEEZE} from './timing.ts';

export const T0 = 720;
const ease = {
  cubicIn: (t: number) => clamp(t) ** 3,
  cubicOut: (t: number) => 1 - (1 - clamp(t)) ** 3,
  inOut: (t: number) => {
    const x = clamp(t);
    return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  },
  expoIn: (t: number) => (t <= 0 ? 0 : 2 ** (10 * clamp(t) - 10)),
};
const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

// ---------------------------------------------------------------- Act 1 path: speed profile → z(g)
const speed = (g: number) => {
  if (g < 30) return 3;
  if (g < 120) return lerp(3, 24, smooth((g - 30) / 90));
  if (g < 300) return lerp(24, 31, (g - 120) / 180);
  if (g < 520) return lerp(31, 35, (g - 300) / 220);
  if (g < 574) return lerp(35, 3.2, smooth((g - 520) / 54));
  return 3.2;
};
const Z_AT_SQUEEZE_END = 6300; // camera z at frame 574 (cloud centre = origin)
const ZT: number[] = (() => {
  const raw: number[] = [];
  let z = 0;
  for (let g = -40; g <= 760; g++) {
    raw.push(z);
    z -= speed(g);
  }
  const off = Z_AT_SQUEEZE_END - raw[574 + 40];
  return raw.map((v) => v + off);
})();
const zAt = (g: number) => {
  const x = clamp(g, -40, 759) + 40;
  const i = Math.floor(x);
  return lerp(ZT[i], ZT[Math.min(ZT.length - 1, i + 1)], x - i);
};

/** Act 1 camera position on its weaving path (before the squeeze settles it onto the axis). */
const pathPos = (g: number): V3 => {
  const settle = 1 - smooth((g - 500) / 74);
  const x = (300 * Math.sin(0.0081 * g + 0.6) + 140 * Math.sin(0.019 * g + 2.0)) * settle;
  const y = (120 * Math.sin(0.0062 * g + 1.1) + 60 * Math.sin(0.021 * g)) * settle;
  return [x, y, zAt(g)];
};

/** Smooth storm handheld (same feel as v1's camJitter, in world units / degrees). */
const jitter = (g: number) => {
  const a = (1.5 + 7 * smooth((g - 30) / 506) + 7 * smooth((g - 560) / 80)) * (1 - smooth((g - (T0 - 6)) / 36));
  return {
    x: a * (Math.sin(0.071 * g) + 0.6 * Math.sin(0.113 * g + 1.3) + 0.35 * Math.sin(0.191 * g + 2.1)),
    y: a * (Math.sin(0.083 * g + 0.7) + 0.55 * Math.sin(0.127 * g + 2.4) + 0.3 * Math.sin(0.173 * g + 0.4)),
    rot: a * 0.06 * (Math.sin(0.057 * g + 0.2) + 0.5 * Math.sin(0.141 * g + 1.1)),
  };
};

// ---------------------------------------------------------------- kinetic lines (giant type on the path)
/** Pass-through frame for each line: just before the next hit (the last one: just before the squeeze). */
const PASS = LINES.map((l, i) => (i < LINES.length - 1 ? LINES[i + 1].f : SQUEEZE) - 8);
const LINE_OFF: Array<[number, number, number]> = [
  [-150, 70, -7],
  [170, -40, 6],
  [-120, -60, 5],
  [140, 60, -5],
  [-60, 90, 4],
  [0, -30, 0],
];
export const LINE3D = LINES.map((l, i) => {
  const p = pathPos(PASS[i]);
  const hitDist = zAt(l.f) - p[2];
  // screen size ~ v1's (112 px, the two long lines 89 px) at the hit
  const px = i >= 4 ? 92 : 116;
  return {text: l.text, f: l.f, pass: PASS[i], p: [p[0] + LINE_OFF[i][0], p[1] + LINE_OFF[i][1], p[2]] as V3, rotY: LINE_OFF[i][2], fontSize: (px * hitDist) / oneToOne(40)};
});

// ---------------------------------------------------------------- the camera
const P40 = oneToOne(40);
/** Headline: 1:1 at its mid-hold, centred in front of the cloud. */
export const HEADLINE_Z = zAt((HEADLINE + 716) / 2) - P40;

// Act 2 key poses
export const LOCK_SHOT: Shot = {...LOGO_CAM, target: [0, -(110 / oneToOne(LOGO_FOV)) * LOGO_D, 0]}; // logo at y≈430 px
export const BEN_SHOT: Shot = {pos: [0, 1500, 13600], target: [0, -2050, 0], fov: 30};

const actOne = (g: number): Shot => {
  const p = pathPos(g);
  const ahead = pathPos(g + 60);
  const j = jitter(g);
  // look ahead along the path, settling onto the cloud centre as the storm compresses
  const look = norm(sub(ahead, p));
  const toCloud = norm(sub([0, 0, 0], p));
  const w = smooth((g - SQUEEZE + 20) / 60);
  const dir = norm(lerp3(look, toCloud, w));
  const side = cross(dir, [0, 1, 0]);
  const k = 2000 / P40; // jitter in screen px, as v1
  const tgt = add(add(p, [dir[0] * 2000, dir[1] * 2000, dir[2] * 2000]), [side[0] * j.x * k, j.y * k, side[2] * j.x * k]);
  // bank with the weave (lateral acceleration), plus handheld roll
  const acc = pathPos(g + 20)[0] - 2 * p[0] + pathPos(g - 20)[0];
  return {pos: p, target: tgt, fov: 40, roll: clamp(-acc * 0.02, -4, 4) + j.rot};
};

const actTwo = (g: number): Shot => {
  const f = g - T0;
  const j = jitter(g);
  const z0 = zAt(T0);
  const start: Shot = {pos: [0, 0, z0], target: [(j.x * z0) / P40, (j.y * z0) / P40, 0], fov: 40, roll: j.rot};
  // 1) pull back and up to watch the rings form, then descend into the logo view (lock at f = 120)
  const pb = ease.inOut(prog(f, 14, 118));
  const rise = Math.sin(Math.PI * pb) * 2600;
  let pos = lerp3(start.pos, LOCK_SHOT.pos, pb);
  pos = add(pos, [-900 * Math.sin(Math.PI * pb), rise, 0]);
  let target = lerp3(start.target, LOCK_SHOT.target, pb);
  let fov = lerp(40, LOGO_FOV, pb);
  let roll = lerp(start.roll ?? 0, 0, pb) + 3 * Math.sin(Math.PI * pb);
  // 2) slow push while the logo holds
  const push = smooth(prog(f, 120, 222));
  pos = add(pos, [0, 0, -LOGO_D * 0.03 * push]);
  // 3) relayout: rise to the benefit view
  const rl = ease.inOut(prog(f, 222, 268));
  pos = lerp3(pos, BEN_SHOT.pos, rl);
  target = lerp3(target, BEN_SHOT.target, rl);
  fov = lerp(fov, BEN_SHOT.fov ?? 30, rl);
  roll = lerp(roll, 0, rl);
  // gentle orbital drift while the benefits lock (yaw ≈ 4°)
  const drift = smooth(prog(f, 262, 540));
  const yaw = (4 * Math.PI * drift) / 180;
  pos = [pos[0] * Math.cos(yaw) + pos[2] * Math.sin(yaw), pos[1], -pos[0] * Math.sin(yaw) + pos[2] * Math.cos(yaw)];
  // 4) the dive: accelerate into the coral satellite, through it at the drop
  const dv = prog(f, 530, 596);
  if (dv > 0) {
    const s = satPos(g);
    const e = dv ** 3.2;
    const aim = smoother(prog(f, 528, 560));
    target = lerp3(target, s, aim);
    const end = add(s, mul3(norm(sub(pos, s)), 310));
    pos = lerp3(pos, end, e);
    fov = lerp(fov, 46, ease.cubicIn(dv));
    roll = lerp(roll, -6, ease.inOut(dv));
  }
  return {pos, target, fov, roll};
};
const mul3 = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];

export const storyCam = (g: number): Shot => (g < T0 ? actOne(g) : actTwo(g));
export {zAt, pathPos};

/** World point that a shot sees at screen pixel (sx, sy),  units in front of the camera (roll ignored). */
export const unproject = (sh: Shot, sx: number, sy: number, depth: number): V3 => {
  const fwd = norm(sub(sh.target, sh.pos));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const P = oneToOne(sh.fov ?? 40);
  const k = depth / P;
  return add(add(add(sh.pos, mul3(fwd, depth)), mul3(right, (sx - 960) * k)), mul3(up, (540 - sy) * k));
};
/** Distance from a shot's camera to a point along its view axis. */
export const depthOf = (sh: Shot, p: V3) => {
  const fwd = norm(sub(sh.target, sh.pos));
  const d = sub(p, sh.pos);
  return d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2];
};

// ---------------------------------------------------------------- Act 2: the benefit orbit
export const BEN_R = 4300;
export const BEN_TILT = (32 * Math.PI) / 180;
/** Point on the benefit orbit (ψ = 0: nearest the camera, below the planet). */
export const benPoint = (psi: number, r = BEN_R): V3 => [r * Math.sin(psi), -r * Math.cos(psi) * Math.sin(BEN_TILT), r * Math.cos(psi) * Math.cos(BEN_TILT)];
export const BEN_PSI = [-0.6, 0, 0.6];
