// The job-hunt storm in 3D, shared by Act 1 (chaos) and Act 2 (turn). Story frame g = global frame.
// Debris = crisp CSS cards (v1's copy and item looks, noise.tsx) living in a 3D volume along the camera path:
// they pop in, tumble, get shoved by every kinetic line, rush into one cloud at the origin (squeeze), implode
// at the cut, then (turn) fall into ordered orbital rings in the logo ring's plane and collapse into the silver
// ring as the planet forms. Dust = WebGL points following the same story.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {Card3D, makeCamera, useCam} from '../../engine/space';
import {add, clamp, cross, dot, len, lerp, lerp3, mul, mulberry32, norm, oneToOne, smooth, sub, type V3} from '../../engine/math';
import {cameraAt} from '../../engine/camera';
import {planetForm, PR, RING_R, ringPoint} from '../../shell/orbit';
import {LINES, PINGS, SQUEEZE} from './timing';
import {COMPANY, CVS, ItemView, type Kind, PILLS, QUAL, ROLES, SKILLS, TABS, TOASTS} from './noise';
import {LINE3D, T0, storyCam, unproject} from './story';
import {ease, prog} from './util';
import {C} from '../../brand';

const TAU = Math.PI * 2;
const CUT = 716;
// ring radii (world units) of the six orbit rings; items use 0–3, dust all six
export const R3 = [1650, 2250, 2950, 3800, 4900, 6200];
const OMEGA = [0.026, 0.02, 0.015, 0.012, 0.008, 0.0062];
const PHASE = [0.3, 1.9, 0.8, 2.6, 1.2, 0.1];

const ringRadius = (k: number, g: number) => (k >= 4 ? R3[k] : lerp(R3[k], RING_R, ease.cubicIn(prog(g, T0 + 84 + 5 * k, T0 + 116))));
const ringPos = (k: number, slot: number, n: number, g: number) => ringPoint((TAU * slot) / n + OMEGA[k] * (g - T0) + PHASE[k], ringRadius(k, g));

// the cloud: random inclined orbits around the origin; implodes at the cut, re-expands as it falls into rings
type Orb = {rc: number; u: V3; v: V3; th0: number; w: number; k: number; slot: number; n: number; tl: number};
const implode = (g: number) => lerp(1, 0.3, ease.cubicIn(prog(g, 700, CUT)));
const cloudPos = (o: Orb, g: number): V3 => {
  const th = o.th0 + o.w * (g - SQUEEZE) * (1 + 1.5 * ease.cubicIn(prog(g, 680, CUT)));
  const r = o.rc * (g < T0 ? implode(g) : 0.3 + 0.7 * ease.cubicOut(prog(g, T0, T0 + 30)));
  return add(mul(o.u, r * Math.cos(th)), mul(o.v, r * Math.sin(th)));
};
const makeOrb = (rnd: () => number, k: number, slot: number, n: number, tl: number, rmax = 2500): Orb => {
  const nz = 0.55 + 0.45 * rnd();
  const a = rnd() * TAU;
  const s = Math.sqrt(1 - nz * nz);
  const nrm: V3 = [s * Math.cos(a), s * Math.sin(a), nz]; // mostly facing the camera: a churning disc-ish cloud
  const u = norm(cross(nrm, [0.3, 1, 0.1]));
  const v = cross(nrm, u);
  return {rc: 350 + rmax * rnd() ** 0.8, u, v, th0: rnd() * TAU, w: (rnd() < 0.5 ? -1 : 1) * (0.014 + 0.04 * rnd()), k, slot, n, tl};
};

// ---------------------------------------------------------------- the debris items
type Item = {
  kind: Kind;
  text: string;
  sub?: string;
  tone?: string;
  spawn: number;
  home: V3;
  from?: V3;
  rot0: V3;
  rate: V3;
  ph: number[];
  lag: number;
  orb: Orb;
  hook?: boolean;
};

const ITEMS: Item[] = (() => {
  const rnd = mulberry32(90210);
  const out: Item[] = [];
  const tumble = (q: boolean): {rot0: V3; rate: V3} => ({
    rot0: [(rnd() * 2 - 1) * (q ? 30 : 18), (rnd() * 2 - 1) * (q ? 40 : 26), (rnd() * 2 - 1) * 10],
    rate: [(rnd() * 2 - 1) * (q ? 0.7 : 0.16), (rnd() * 2 - 1) * (q ? 0.9 : 0.2), (rnd() * 2 - 1) * 0.12],
  });
  const add_ = (kind: Kind, text: string, spawn: number, home: V3, extra: Partial<Item> = {}) =>
    out.push({kind, text, spawn, home, ...tumble(kind === 'q'), ph: [0, 1, 2, 3].map(() => rnd() * TAU), lag: rnd() * 14, orb: null as unknown as Orb, ...extra});
  // screen point away from the central band where the kinetic lines read
  const scatter = (): [number, number] => {
    for (;;) {
      const x = -220 + rnd() * 2360;
      const y = -120 + rnd() * 1320;
      if (!(Math.abs(x - 960) < 560 && Math.abs(y - 540) < 150) || rnd() < 0.1) return [x, y];
    }
  };
  // notification toasts, one per ping (the first is the hook: centre stage, 1:1)
  PINGS.forEach((p, i) => {
    const [t, s] = TOASTS[i % TOASTS.length];
    if (i === 0) add_('toast', t, p.f, [0, 0, 0], {sub: s, hook: true, rot0: [0, 0, 0], rate: [0, 0, 0]});
    else add_('toast', t, p.f, unproject(storyCam(p.f), p.x, p.y, 2300 + 1500 * rnd()), {sub: s});
  });
  // a burst out of every kinetic line
  const burst = (k: number, n: number, mk: (j: number) => [Kind, string, string?, string?]) => {
    const L = LINE3D[k];
    for (let j = 0; j < n; j++) {
      const [kind, text, sub, tone] = mk(j);
      const a = rnd() * TAU;
      const home: V3 = add(L.p, [Math.cos(a) * (850 + 1500 * rnd()), Math.sin(a) * (480 + 900 * rnd()), 200 + 1700 * rnd()]);
      add_(kind, text, LINES[k].f - 1 + j * 0.6, home, {from: add(L.p, [(rnd() - 0.5) * 500, (rnd() - 0.5) * 120, -700]), sub, tone});
    }
  };
  burst(0, 16, (j) => ['tab', TABS[j % TABS.length]]);
  burst(1, 10, (j) => ['card', ROLES[j % ROLES.length], COMPANY[j % COMPANY.length], String(j % 6)]);
  burst(2, 10, (j) => ['pill', PILLS[j][0], undefined, PILLS[j][1]]);
  burst(3, 14, (j) => (j < 8 ? ['chip', QUAL[j]] : ['q', '?']));
  burst(4, 10, (j) => ['cv', CVS[j]]);
  burst(5, 14, (j) => (j < 8 ? ['chip', SKILLS[j]] : ['q', '?']));
  // background trickle, ahead of the camera, deeper in the storm
  const mix: Kind[] = ['tab', 'card', 'cv', 'q', 'tab', 'pill', 'q', 'card', 'cv', 'tab'];
  const NT = 170;
  for (let j = 0; j < NT; j++) {
    const kind = mix[j % mix.length];
    const spawn = 34 + 500 * (j / NT) ** 0.8 + rnd() * 10;
    const text = kind === 'tab' ? TABS[(j * 5) % TABS.length] : kind === 'card' ? ROLES[(j * 3) % ROLES.length] : kind === 'cv' ? CVS[(j * 7) % CVS.length] : kind === 'pill' ? PILLS[j % PILLS.length][0] : '?';
    const [sx, sy] = scatter();
    const near = j % 6 === 0; // every sixth one whooshes past close to the lens
    add_(kind, text, spawn, unproject(storyCam(spawn), near ? sx * 1.3 - 290 : sx, near ? sy * 1.3 - 160 : sy, near ? 650 + 700 * rnd() : 1300 + 4600 * rnd() ** 1.3), {sub: COMPANY[j % COMPANY.length], tone: kind === 'card' ? String(j % 6) : PILLS[j % PILLS.length][1]});
  }
  // orbit assignment: rings 0–3, evenly spaced
  const ringOf = out.map((_, i) => [0, 1, 2, 3, 1, 2, 3, 2, 3, 3][i % 10]);
  const counts = [0, 0, 0, 0];
  ringOf.forEach((k) => counts[k]++);
  const seen = [0, 0, 0, 0];
  out.forEach((it, i) => {
    const k = ringOf[i];
    it.orb = makeOrb(rnd, k, seen[k]++, counts[k], 4 * k + rnd() * 10);
  });
  return out;
})();

// every line hit shoves the debris outward from its axis
const shove = (g: number, p: V3): V3 => {
  let dx = 0;
  let dy = 0;
  for (const L of LINE3D) {
    if (g < L.f) break;
    const dz = Math.abs(p[2] - L.p[2]);
    if (dz > 3600) continue;
    const ox = p[0] - L.p[0];
    const oy = p[1] - L.p[1];
    const d = Math.hypot(ox, oy) + 1;
    const k = 520 * ease.expoOut(prog(g, L.f, L.f + 30)) * Math.exp(-d / 2600) * (1 - dz / 3600);
    dx += (ox / d) * k;
    dy += (oy / d) * k * 0.8;
  }
  return [p[0] + dx, p[1] + dy, p[2]];
};

const P40 = oneToOne(40);
type ItemState = {p: V3; s: number; op: number; r: V3; b: number};
const itemState = (it: Item, g: number, camRot: V3): ItemState | null => {
  const age = g - it.spawn;
  if (age < 0) return null;
  // storm
  let p: V3;
  if (it.hook) {
    // holds centre stage at 1:1, riding with the camera, until the first line knocks it into the storm
    const gc = Math.min(g, LINES[0].f - 4);
    const c = storyCam(gc);
    const base = unproject(c, 960, 540, P40);
    const kn = ease.expoOut(prog(g, LINES[0].f - 4, LINES[0].f + 26));
    p = add(base, [-900 * kn, 420 * kn, 300 * kn]);
  } else {
    const fly = it.from ? ease.expoOut(prog(age, 0, 30)) : 1;
    const h = it.from ? lerp3(it.from, it.home, fly) : it.home;
    const A = 40 + 90 * smooth((g - 30) / 500);
    p = shove(g, [h[0] + A * (Math.sin(0.021 * g + it.ph[0]) + 0.5 * Math.sin(0.057 * g + it.ph[1])), h[1] + A * 0.7 * (Math.cos(0.019 * g + it.ph[2]) + 0.5 * Math.sin(0.049 * g + it.ph[3])), h[2] + 80 * Math.sin(0.013 * g + it.ph[1])]);
  }
  const pop = ease.backOut(prog(age, 0, it.hook ? 9 : 12));
  const sStorm = lerp(0.3, 1, pop) * (it.hook ? 1.45 : 1.3);
  const oStorm = clamp(age / (it.from ? 9 : 5));
  const rStorm: V3 = it.hook ? [0, 0, 0] : [it.rot0[0] + it.rate[0] * g, it.rot0[1] + it.rate[1] * g, it.rot0[2] + it.rate[2] * g];
  // cloud (squeeze → cut) and rings (turn)
  const E = ease.cubicIn(prog(g, SQUEEZE + it.lag * 0.6, 574));
  const T = ease.cubicInOut(prog(g, T0 + 2 + it.orb.tl, T0 + 66 + it.orb.tl));
  if (E > 0) p = lerp3(p, cloudPos(it.orb, g), E);
  const k = it.orb.k;
  if (T > 0) p = lerp3(p, ringPos(k, it.orb.slot, it.orb.n, g), T);
  const collapse = prog(g, T0 + 92 + k * 3, T0 + 116);
  const s = lerp(lerp(sStorm, 1.5, E), 2.3, T) * (1 - 0.8 * collapse);
  const op = lerp(oStorm, 0.95, E) * (1 - ease.cubicIn(collapse));
  const spin = E * (1 - T) * 40;
  const r: V3 = [lerp(rStorm[0] + spin * Math.sin(0.05 * g + it.ph[0]), camRot[0], T), lerp(rStorm[1] + spin * Math.cos(0.04 * g + it.ph[2]), camRot[1], T), lerp(rStorm[2], camRot[2], T)];
  return {p, s, op, r, b: T};
};

/** 0 → 1 visibility of a point given the planet (CSS is always drawn over WebGL, so hide what the planet hides). */
const unoccluded = (p: V3, cam: V3, R: number) => {
  if (R < 1) return 1;
  const d = sub(p, cam);
  const L = len(d);
  const dir = mul(d, 1 / L);
  const tc = -dot(cam, dir); // closest approach to the planet centre (origin) along the ray
  if (tc <= 0 || L < tc) return 1; // the planet is behind the camera, or the point is in front of its centre
  const miss = len(add(cam, mul(dir, tc)));
  return smooth((miss - R) / 120 + 0.5);
};

/** CSS debris for story frames [from, to). */
export const Debris: React.FC<{g: number; from: number; to: number}> = ({g, from, to}) => {
  const cam = useCam();
  if (g < from || g >= to) return null;
  const e = new THREE.Euler().setFromQuaternion(makeCamera(cam).quaternion, 'XYZ');
  const camRot: V3 = [(e.x * 180) / Math.PI, (e.y * 180) / Math.PI, (e.z * 180) / Math.PI];
  const fwd = norm(sub(cam.target, cam.pos));
  const R = planetForm(g) * PR;
  return (
    <>
      {ITEMS.map((it, i) => {
        const st = itemState(it, g, camRot);
        if (!st || st.op < 0.01 || st.s < 0.02) return null;
        const depth = dot(sub(st.p, cam.pos), fwd);
        if (depth < 40 || depth > 16000) return null;
        const vis = unoccluded(st.p, cam.pos, R);
        if (vis < 0.01) return null;
        return (
          <Card3D key={i} p={st.p} r={st.r} s={st.s} opacity={st.op * vis} near={90} nearFade={700} dof={g < SQUEEZE + 20 ? 1.1 : 0}>
            <ItemView it={it} b={st.b} />
          </Card3D>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- dust (WebGL points, CPU-posed per frame)
type Dust = {p: V3; v: V3; size: number; a: number; spawn: number; fl: number; ph: number; lag: number; orb: Orb; tint: string};
const NDUST = 4000;
const DUST: Dust[] = (() => {
  const rnd = mulberry32(777);
  const ks: number[] = [];
  for (let i = 0; i < NDUST; i++) ks.push(i % 20 < 9 ? i % 4 : 4 + (i % 2));
  const counts = [0, 0, 0, 0, 0, 0];
  ks.forEach((k) => counts[k]++);
  const seen = [0, 0, 0, 0, 0, 0];
  return ks.map((k, i) => {
    const big = rnd() < 0.05;
    const z = 3500 + rnd() * 19000;
    const spread = 0.35 + 0.65 * rnd();
    return {
      p: [(rnd() * 2 - 1) * 2900 * spread, (rnd() * 2 - 1) * 1700 * spread, z],
      v: [(rnd() * 2 - 1) * 1.6, (rnd() * 2 - 1) * 1.0, (rnd() * 2 - 1) * 1.2],
      size: big ? 16 + 18 * rnd() : 3 + 6 * rnd() ** 2,
      a: big ? 0.18 + 0.15 * rnd() : 0.3 + 0.55 * rnd(),
      spawn: 10 + 520 * rnd() ** 1.3,
      fl: 0.05 + 0.25 * rnd(),
      ph: rnd() * TAU,
      lag: rnd() * 18,
      orb: makeOrb(rnd, k, seen[k]++, counts[k], k * 3 + rnd() * 8, 2700),
      tint: i % 7 === 0 ? C.coral : i % 3 === 0 ? C.sky : C.ink,
    };
  });
})();

const DUST_VS = /* glsl */ `
attribute vec3 aColor; attribute float aAlpha; attribute float aSize;
uniform float uP;
varying vec3 vC; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = max(-mv.z, 1.0);
  gl_PointSize = clamp(aSize * uP / d, 1.2, 36.0);
  vC = aColor; vA = aAlpha * smoothstep(60.0, 260.0, d);
}`;
const DUST_FS = /* glsl */ `
varying vec3 vC; varying float vA;
void main(){
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.1, r) * vA;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

const STORM_COL = new THREE.Color('#e8e3d4');
/** WebGL dust for story frames [from, to) (mounted by both acts; each draws only its own frames). */
export const StoryDust: React.FC<{g: number; from: number; to: number}> = ({g, from, to}) => {
  const {geo, mat, tints} = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NDUST * 3), 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(NDUST * 3), 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(NDUST), 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(NDUST), 1));
    const mat = new THREE.ShaderMaterial({uniforms: {uP: {value: 1483}}, vertexShader: DUST_VS, fragmentShader: DUST_FS, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true});
    return {geo, mat, tints: DUST.map((d) => new THREE.Color(d.tint))};
  }, []);
  const active = g >= from && g < to;
  useLayoutEffect(() => {
    if (!active) return;
    const pos = geo.attributes.position.array as Float32Array;
    const col = geo.attributes.aColor.array as Float32Array;
    const al = geo.attributes.aAlpha.array as Float32Array;
    const sz = geo.attributes.aSize.array as Float32Array;
    const storm = smooth((g - 20) / 280);
    const settled = smooth((g - (T0 + 100)) / 50);
    const outerFade = 1 - smooth((g - 1230) / 70);
    const c = new THREE.Color();
    for (let i = 0; i < NDUST; i++) {
      const d = DUST[i];
      const age = g - d.spawn;
      const E = ease.cubicIn(prog(g, SQUEEZE - 6 + d.lag, 576));
      const T = ease.cubicInOut(prog(g, T0 + 2 + d.orb.tl, T0 + 60 + d.orb.tl));
      let p: V3 = [d.p[0] + d.v[0] * g + 40 * Math.sin(0.02 * g + d.ph), d.p[1] + d.v[1] * g + 30 * Math.cos(0.017 * g + d.ph), d.p[2] + d.v[2] * g];
      if (E > 0) p = lerp3(p, cloudPos(d.orb, g), E);
      const k = d.orb.k;
      if (T > 0) p = lerp3(p, ringPos(k, d.orb.slot, d.orb.n, g), T);
      const inner = k < 4;
      const collapse = inner ? prog(g, T0 + 96, T0 + 122) : 0;
      const flick = 0.65 + 0.35 * Math.sin(d.fl * g + d.ph);
      let a = age < 0 ? 0 : d.a * clamp(age / 12) * lerp(storm * flick, 1, E) * (1 - collapse);
      a *= lerp(1, lerp(1, inner ? 1 : 0.55 * outerFade, settled), T);
      pos[i * 3] = p[0];
      pos[i * 3 + 1] = p[1];
      pos[i * 3 + 2] = p[2];
      c.copy(STORM_COL).lerp(tints[i], T);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      al[i] = a;
      sz[i] = d.size * (1 + 0.8 * E * (1 - T)) * lerp(1, 2.2, T);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    mat.uniforms.uP.value = 540 / Math.tan(((cameraAt(g).fov / 2) * Math.PI) / 180);
  }, [g, active, geo, mat, tints]);
  if (!active) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={15} />;
};

