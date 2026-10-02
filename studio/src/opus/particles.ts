// Thousands of glowing beads. Every position is an analytic function of the frame:
// burst out of the sphere -> helical liquid ribbon wound around the camera's own path ->
// frozen held breath -> spring-snap onto points sampled from the title glyph faces.
import * as THREE from 'three';
import * as TL from './timeline';
import type {Choreo, Layout} from './choreo';
import {R} from './choreo';
import {clamp, easeOut, mulberry32, smoothstep, spring} from './math';
import {glyphArea, sampleFace} from './text';

export const COUNT = 4200;
const N_SPHERE = 420;
const AXN = 400; // samples along the ribbon spine

export const createParticles = (L: Layout, C: Choreo) => {
  const rnd = mulberry32(20250);
  // --- targets on the title (area weighted) and on the re-formed sphere ---
  const target = new Float32Array(COUNT * 3);
  const areas = L.title.map((p) => glyphArea(p.g));
  const total = areas.reduce((a, b) => a + b, 0);
  let n = 0;
  L.title.forEach((p, gi) => {
    const want = gi === L.title.length - 1 ? COUNT - N_SPHERE - n : Math.round(((COUNT - N_SPHERE) * areas[gi]) / total);
    for (const v of sampleFace(p.g, want, rnd)) {
      target.set([p.pos[0] + v.x, p.pos[1] + v.y, p.pos[2] + v.z], n * 3);
      n++;
    }
  });
  for (; n < COUNT; n++) {
    const u = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u) * L.periodR;
    target.set([C.R0[0] + s * Math.cos(a), C.R0[1] + u * L.periodR, C.R0[2] + s * Math.sin(a)], n * 3);
  }

  // --- per-particle seeds ---
  const s0 = new Float32Array(COUNT);
  const band = new Float32Array(COUNT);
  const radial = new Float32Array(COUNT);
  const size = new Float32Array(COUNT);
  const dir = new Float32Array(COUNT * 3);
  const delay = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    s0[i] = rnd();
    band[i] = rnd() - 0.5;
    radial[i] = rnd() - 0.5;
    size[i] = 0.55 + 0.45 * Math.pow(rnd(), 2);
    const u = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    dir.set([s * Math.cos(a), u, s * Math.sin(a)], i * 3);
    delay[i] = rnd() * 3;
  }

  // --- the ribbon's spine: a world-space curve from the sphere down toward the title area ---
  const A = C.A;
  const P0 = new THREE.Vector3(A[0], A[1] - 0.15, A[2] + 0.6);
  const P1 = new THREE.Vector3(0.2, 3.6, 3.0);
  const P2 = new THREE.Vector3(0, 1.5, -6.2);
  const spine = new THREE.QuadraticBezierCurve3(P0, P1, P2);
  const ax = new Float32Array(AXN * 3);
  const tx = new Float32Array(AXN * 3);
  const nx = new Float32Array(AXN * 3);
  const bx = new Float32Array(AXN * 3);
  {
    const up = new THREE.Vector3(0, 1, 0);
    const p = new THREE.Vector3();
    const tg = new THREE.Vector3();
    const nn = new THREE.Vector3();
    const bb = new THREE.Vector3();
    for (let k = 0; k < AXN; k++) {
      const s = k / (AXN - 1);
      spine.getPointAt(s, p);
      spine.getTangentAt(s, tg);
      nn.crossVectors(tg, up).normalize();
      bb.crossVectors(nn, tg).normalize();
      ax.set([p.x, p.y, p.z], k * 3);
      tx.set([tg.x, tg.y, tg.z], k * 3);
      nx.set([nn.x, nn.y, nn.z], k * 3);
      bx.set([bb.x, bb.y, bb.z], k * 3);
    }
  }
  const T0 = TL.SPLIT / TL.FPS;

  // ribbon position for slot s at time t (seconds)
  const ribbon = (i: number, s: number, t: number, out: Float32Array) => {
    const tt = t - T0;
    s = clamp(s, 0, 0.9999);
    const fk = s * (AXN - 1);
    const k = Math.floor(fk);
    const w = fk - k;
    const strand = i & 1;
    const build = clamp(tt / 2.5);
    const theta = strand * Math.PI + 2 * Math.PI * 4.5 * s + 1.1 * tt + 0.55 * tt * tt + band[i] * 0.35;
    const funnel = 1 - 0.6 * smoothstep(0.7, 1, s);
    const rho = (2.3 + 0.45 * Math.sin(2 * Math.PI * 3 * s - 2.6 * tt)) * funnel + radial[i] * 0.34;
    const wave = (0.1 + 0.45 * build) * Math.sin(2 * Math.PI * 2.2 * s - 3.6 * tt + strand * Math.PI);
    const c = Math.cos(theta) * rho;
    const sn = Math.sin(theta) * rho;
    const bw = band[i] * 0.95;
    for (let d = 0; d < 3; d++) {
      const a0 = ax[k * 3 + d] + (ax[(k + 1) * 3 + d] - ax[k * 3 + d]) * w;
      out[d] = a0 + nx[k * 3 + d] * c + bx[k * 3 + d] * sn + tx[k * 3 + d] * bw;
    }
    out[1] += wave;
  };

  const slot = (i: number) => 0.015 + 0.985 * s0[i];
  const release = (i: number) => T0 + 0.05 + 0.75 * slot(i) + 0.03 * delay[i];

  const tmp = new Float32Array(3);
  const frozen = new Float32Array(COUNT * 3);
  const frozenVis = new Float32Array(COUNT).fill(1); // beads hidden near the lens at the freeze stay hidden until they land
  // position + visibility scale at a float frame
  const at = (i: number, f: number, out: Float32Array, o: number): number => {
    if (f >= TL.DROP) {
      const e = spring((f - TL.DROP - delay[i]) / TL.FPS, 2.5, 0.52);
      for (let d = 0; d < 3; d++) out[o + d] = frozen[i * 3 + d] + (target[i * 3 + d] - frozen[i * 3 + d]) * e;
      const isSphere = i >= COUNT - N_SPHERE;
      const show = frozenVis[i] + (1 - frozenVis[i]) * smoothstep(0.75, 1, e);
      return show * (isSphere ? 1 - smoothstep(TL.REFORM - 2, TL.REFORM + 10, f) : 1 - smoothstep(TL.DROP + 14, TL.DROP + 38, f + delay[i] * 2));
    }
    const t = Math.min(f, TL.FREEZE) / TL.FPS;
    const tr = release(i);
    if (t < tr) return 0;
    const age = t - tr;
    // pop out of the glass, then get carried along the ribbon to its slot and keep flowing
    const burst = easeOut(age / 0.4);
    const travel = smoothstep(0, 0.6 + 1.0 * slot(i), age);
    const s = slot(i) * travel + 0.02 * Math.max(0, age - 0.6) * (1 + age);
    ribbon(i, s, t, tmp);
    const b = smoothstep(0, 0.55, age);
    for (let d = 0; d < 3; d++) {
      const start = A[d] + dir[i * 3 + d] * R * (0.55 + 0.6 * burst);
      out[o + d] = start + (tmp[d] - start) * b;
    }
    return smoothstep(0, 0.1, age);
  };
  const fr = TL.FREEZE;
  const camF = C.camera(fr).pos;
  for (let i = 0; i < COUNT; i++) {
    frozenVis[i] = at(i, fr, frozen, i * 3) * smoothstep(0.6, 1.8, Math.hypot(frozen[i * 3] - camF[0], frozen[i * 3 + 1] - camF[1], frozen[i * 3 + 2] - camF[2]));
  }

  // --- instanced mesh ---
  const geom = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({color: new THREE.Color(1, 1, 1)});
  const mesh = new THREE.InstancedMesh(geom, mat, COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const col = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    const h = rnd();
    col.setRGB(1.0, 0.2 + 0.12 * h, 0.035 + 0.03 * h);
    mesh.setColorAt(i, col);
  }

  const pA = new Float32Array(3);
  const pB = new Float32Array(3);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const vY = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const ps = new THREE.Vector3();
  const update = (f: number, streak = 0.5) => {
    const active = f >= TL.SPLIT - 2 && f < TL.DROP + 50;
    mesh.visible = active;
    if (!active) return;
    // glow ramps with the build, flashes on the snap
    const build = smoothstep(TL.SPLIT, TL.FREEZE, f);
    const flash = f >= TL.DROP ? Math.exp(-(f - TL.DROP) / 10) : 0;
    mat.color.setScalar(1.3 + 1.5 * build + 1.0 * flash);
    const grow = 1 + 0.3 * build;
    const cam = C.camera(f).pos;
    for (let i = 0; i < COUNT; i++) {
      let vis = at(i, f, pA, 0);
      // beads that would brush the lens shrink away instead of filling the frame
      vis *= smoothstep(0.6, 1.8, Math.hypot(pA[0] - cam[0], pA[1] - cam[1], pA[2] - cam[2]));
      if (vis <= 0.001) {
        m4.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, m4);
        continue;
      }
      at(i, f - streak, pB, 0); // shutter slice -> streak length
      v.set(pA[0] - pB[0], pA[1] - pB[1], pA[2] - pB[2]);
      const vl = v.length();
      const len = Math.min(vl, 1.0);
      const r = 0.0085 * size[i] * grow * vis;
      if (vl > 1e-5) q.setFromUnitVectors(vY, v.multiplyScalar(1 / vl));
      else q.identity();
      sc.set(r, r + len * 0.5 * vis, r);
      ps.set((pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2, (pA[2] + pB[2]) / 2);
      m4.compose(ps, q, sc);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return {mesh, update};
};
