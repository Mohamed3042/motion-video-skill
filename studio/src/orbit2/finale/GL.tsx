// Finale · WebGL (world coords): each station's orbit ring lights on its montage beat (accent), with a flare on
// the station; at CONVERGE the ten rings shrink, tilt into the logo ring's plane and turn silver, riding into
// the planet; the lock (6480) fires the shockwaves and the flash; then a faint ten-orbit halo circles the logo.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {ACCENT, C} from '../brand';
import {WORLDS} from '../timing';
import {PLACEMENT, STATION_RADIUS} from '../engine/layout';
import {Glow3D} from '../engine/glow';
import {clamp, smooth} from '../engine/math';
import {RING_OFF, RING_R, RING_ROLL, RING_TILT} from '../shell/orbit';
import {Shock} from '../sections/turn/GL';
import {CONVERGE, LOGO_LOCK, MONTAGE_BEATS} from './timing';

const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const inOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
const Q_RING = new THREE.Quaternion().setFromEuler(new THREE.Euler(RING_TILT, 0, RING_ROLL, 'ZYX')); // XZ circle → logo ring plane
const SILVER = new THREE.Color('#dfe7f5');

const circleLine = (n = 160, dashed = false) => {
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(Math.cos(a), 0, Math.sin(a));
  }
  const geo = new LineGeometry();
  geo.setPositions(pts);
  const mat = new LineMaterial({linewidth: 2, transparent: true, depthWrite: false, worldUnits: false, dashed});
  mat.blending = THREE.AdditiveBlending;
  mat.resolution.set(1920, 1080);
  const l = new Line2(geo, mat);
  l.computeLineDistances();
  l.frustumCulled = false;
  l.renderOrder = 8;
  return l;
};

const conv = (g: number) => inOut(prog(g, CONVERGE - 14, LOGO_LOCK - 2));

const StationRing: React.FC<{j: number; g: number}> = ({j, g}) => {
  const w = WORLDS[j];
  const line = useMemo(() => circleLine(), []);
  const beat = MONTAGE_BEATS[j];
  const draw = inOut(prog(g, beat - 4, beat + 18));
  const e = conv(g);
  const op = draw * (1 - prog(g, LOGO_LOCK - 4, LOGO_LOCK + 2));
  line.visible = op > 0.003;
  if (!line.visible) return <primitive object={line} />;
  const y = PLACEMENT[w.id].origin[1];
  const r = STATION_RADIUS + (RING_R - STATION_RADIUS) * e;
  line.position.set(RING_OFF[0] * e, y * (1 - e) + RING_OFF[1] * e, 0);
  const wob = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ((j % 2 ? 1 : -1) * (6 + 2 * j) * (1 - e) * Math.PI) / 180);
  line.quaternion.copy(new THREE.Quaternion().slerp(Q_RING, e)).premultiply(wob);
  line.scale.setScalar(r);
  const m = line.material as LineMaterial;
  m.color.set(ACCENT[w.id]).lerp(SILVER, e).multiplyScalar(1.3 + 0.8 * e);
  m.opacity = op * (0.55 + 0.45 * e);
  m.linewidth = 1.6 + 1.6 * e;
  line.geometry.instanceCount = Math.max(1, Math.floor(160 * draw));
  return <primitive object={line} />;
};

/** The beacon of station j: flares on its beat, glows while lit, rides its ring into the planet at converge. */
const StationFlare: React.FC<{j: number; g: number}> = ({j, g}) => {
  const w = WORLDS[j];
  const beat = MONTAGE_BEATS[j];
  if (g < beat - 2 || g > LOGO_LOCK) return null;
  const pl = PLACEMENT[w.id];
  const e = conv(g);
  // ride the converging ring: the station's direction on a circle of shrinking radius, tilting into the ring plane
  const r = STATION_RADIUS + (RING_R - STATION_RADIUS) * e;
  const local = new THREE.Vector3(Math.sin(pl.yaw), 0, Math.cos(pl.yaw)).multiplyScalar(r);
  local.applyQuaternion(new THREE.Quaternion().slerp(Q_RING, e));
  const p: [number, number, number] = [local.x + RING_OFF[0] * e, local.y + pl.origin[1] * (1 - e) + RING_OFF[1] * e, local.z];
  const flare = g >= beat ? Math.exp(-(g - beat) / 12) : 0;
  const lit = smooth(prog(g, beat, beat + 8)) * (1 - prog(g, LOGO_LOCK - 6, LOGO_LOCK));
  const acc = ACCENT[w.id];
  return (
    <group position={p}>
      <Glow3D size={7000} color={acc} opacity={0.85 * flare} intensity={1.6} />
      <Glow3D size={1900 * (1 - 0.5 * e)} color={acc} opacity={0.75 * lit} intensity={1.4} />
      <Glow3D size={420} color="#ffffff" opacity={lit} intensity={2} />
    </group>
  );
};

const Halo: React.FC<{j: number; g: number}> = ({j, g}) => {
  const line = useMemo(() => circleLine(240, true), []);
  const vis = smooth(prog(g, LOGO_LOCK + 10, LOGO_LOCK + 70));
  line.visible = vis > 0.003;
  const m = line.material as LineMaterial;
  const n = 56 + 6 * j;
  m.dashSize = Math.PI / n;
  m.gapSize = Math.PI / n;
  m.dashOffset = ((j % 2 ? 1 : -1) * (g - LOGO_LOCK) * 0.0015) % (2 * Math.PI);
  m.color.set(ACCENT[WORLDS[j].id]).multiplyScalar(1.2);
  m.opacity = 0.32 * vis;
  m.linewidth = 2;
  line.position.set(...RING_OFF);
  line.quaternion.copy(Q_RING);
  line.scale.setScalar(RING_R * 1.45 + 300 * j);
  return <primitive object={line} />;
};

export const GL: React.FC = () => {
  const g = useCurrentFrame();
  const t = g - LOGO_LOCK;
  const lockFlash = t >= 0 ? Math.exp(-t / 9) : 0;
  return (
    <>
      {WORLDS.map((_, j) => (
        <React.Fragment key={j}>
          <StationRing j={j} g={g} />
          <StationFlare j={j} g={g} />
          <Halo j={j} g={g} />
        </React.Fragment>
      ))}
      {lockFlash > 0.01 ? (
        <>
          <Glow3D size={12000} color="#7f9dff" opacity={lockFlash} intensity={1.4} />
          <Glow3D size={5200} color="#ffffff" opacity={0.85 * lockFlash} intensity={1.7} />
          <Glow3D size={3600} color={C.coral} opacity={0.6 * lockFlash} intensity={1.5} />
        </>
      ) : null}
      <Shock f={t} at={0} color={C.coral} r0={RING_R} r1={12500} dur={56} w={340} />
      <Shock f={t} at={5} color="#ffffff" r0={RING_R} r1={9000} dur={50} w={140} k={0.85} />
      <Shock f={t} at={2} color={C.sky} r0={RING_R * 1.1} r1={15000} dur={60} w={200} k={0.7} />
    </>
  );
};
