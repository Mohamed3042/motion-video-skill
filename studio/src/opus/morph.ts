// One high-res grid (u around, v pole-to-pole) whose vertices are interpolated between five
// precomputed target shapes with identical vertex order. Normals are recomputed every frame from
// the grid (wrapping in u, one-sided at the poles) so there is no seam and no tearing.
import * as THREE from 'three';
import {MORPH, FPS} from './timeline';
import {spring} from './math';

const U = 192;
const V = 128;
const NV = U * (V + 1);
const idx = (iu: number, iv: number) => iv * U + (((iu % U) + U) % U);

const rot = (ax: number, ay: number, az: number) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(ax, ay, az));

const shapeSphere = (u: number, v: number, out: THREE.Vector3) => {
  const th = Math.PI * v;
  const ph = 2 * Math.PI * u;
  return out.set(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
};

const cubeRot = rot(0.45, 0.6, 0.2);
const cubeInv = cubeRot.clone().invert();
const shapeCube = (u: number, v: number, out: THREE.Vector3) => {
  shapeSphere(u, v, out).applyMatrix4(cubeRot);
  const n = 7;
  const s = 0.86 / Math.pow(Math.pow(Math.abs(out.x), n) + Math.pow(Math.abs(out.y), n) + Math.pow(Math.abs(out.z), n), 1 / n);
  return out.multiplyScalar(s).applyMatrix4(cubeInv);
};

const torusRot = rot(0.25, 0, 0.95);
const shapeTorus = (u: number, v: number, out: THREE.Vector3) => {
  const Rm = 0.66;
  const rt = 0.35;
  const phi = Math.PI - 2 * Math.PI * v; // v=0 and v=1 meet on the inner ring, v=0.5 is the outer equator
  const ph = 2 * Math.PI * u;
  const rr = Rm + rt * Math.cos(phi);
  return out.set(rr * Math.cos(ph), rt * Math.sin(phi), rr * Math.sin(ph)).applyMatrix4(torusRot);
};

const pillRot = rot(0.2, 0, 0.12);
const pillInv = pillRot.clone().invert();
const shapePill = (u: number, v: number, out: THREE.Vector3) => {
  // ray-cast the sphere direction onto a capsule along local z
  shapeSphere(u, v, out).applyMatrix4(pillInv);
  const r = 0.54;
  const Lh = 0.8;
  const radial = Math.hypot(out.x, out.y);
  let t = radial > 1e-6 ? r / radial : Infinity;
  if (Math.abs(t * out.z) > Lh) {
    const sz = Math.sign(out.z) * Lh * out.z;
    t = sz + Math.sqrt(Math.max(0, sz * sz - Lh * Lh + r * r));
  }
  return out.multiplyScalar(t).applyMatrix4(pillRot);
};

export const createMorph = () => {
  const fns = [shapeSphere, shapeCube, shapeTorus, shapePill, shapeSphere];
  const targets = fns.map((fn) => {
    const arr = new Float32Array(NV * 3);
    const p = new THREE.Vector3();
    for (let iv = 0; iv <= V; iv++)
      for (let iu = 0; iu < U; iu++) {
        fn(iu / U, iv / V, p);
        arr.set([p.x, p.y, p.z], idx(iu, iv) * 3);
      }
    return arr;
  });
  const index: number[] = [];
  for (let iv = 0; iv < V; iv++)
    for (let iu = 0; iu < U; iu++) {
      const a = idx(iu, iv);
      const b = idx(iu + 1, iv);
      const c = idx(iu + 1, iv + 1);
      const d = idx(iu, iv + 1);
      index.push(a, b, d, b, c, d);
    }
  const geom = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(targets[0].slice(), 3);
  const nor = new THREE.BufferAttribute(new Float32Array(NV * 3), 3);
  pos.setUsage(THREE.DynamicDrawUsage);
  nor.setUsage(THREE.DynamicDrawUsage);
  geom.setAttribute('position', pos);
  geom.setAttribute('normal', nor);
  geom.setIndex(index);
  geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.6);

  const P = pos.array as Float32Array;
  const Nn = nor.array as Float32Array;
  const computeNormals = () => {
    for (let iv = 0; iv <= V; iv++) {
      const va = Math.max(0, iv - 1);
      const vb = Math.min(V, iv + 1);
      // near the poles the u-tangent degenerates; borrow it from the neighbouring ring
      const ru = iv === 0 ? 1 : iv === V ? V - 1 : iv;
      for (let iu = 0; iu < U; iu++) {
        const i0 = idx(iu, va) * 3;
        const i1 = idx(iu, vb) * 3;
        const j0 = idx(iu - 1, ru) * 3;
        const j1 = idx(iu + 1, ru) * 3;
        const tvx = P[i1] - P[i0], tvy = P[i1 + 1] - P[i0 + 1], tvz = P[i1 + 2] - P[i0 + 2];
        const tux = P[j1] - P[j0], tuy = P[j1 + 1] - P[j0 + 1], tuz = P[j1 + 2] - P[j0 + 2];
        let nx = tuy * tvz - tuz * tvy;
        let ny = tuz * tvx - tux * tvz;
        let nz = tux * tvy - tuy * tvx;
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l;
        ny /= l;
        nz /= l;
        const o = idx(iu, iv) * 3;
        Nn[o] = nx;
        Nn[o + 1] = ny;
        Nn[o + 2] = nz;
      }
    }
    nor.needsUpdate = true;
  };

  let last = -1;
  // Each shape lands on its beat with a soft spring; the change ripples from top to bottom like molten glass.
  const update = (f: number) => {
    const active = f > MORPH[0] - 20 && f < MORPH[4] + 60;
    const key = active ? f : -2;
    if (key === last) return;
    last = key;
    if (!active) {
      P.set(targets[0]);
    } else {
      const w = new Float32Array(4);
      for (let iv = 0; iv <= V; iv++) {
        const delay = 7 * (iv / V);
        for (let s = 0; s < 4; s++) w[s] = spring((f - (MORPH[s + 1] - 14) - delay) / FPS, 2.3, 0.6);
        for (let iu = 0; iu < U; iu++) {
          const o = idx(iu, iv) * 3;
          for (let c = 0; c < 3; c++) {
            let v = targets[0][o + c];
            for (let s = 0; s < 4; s++) v += w[s] * (targets[s + 1][o + c] - targets[s][o + c]);
            P[o + c] = v;
          }
        }
      }
    }
    pos.needsUpdate = true;
    computeNormals();
  };
  update(0);
  return {geom, update};
};
