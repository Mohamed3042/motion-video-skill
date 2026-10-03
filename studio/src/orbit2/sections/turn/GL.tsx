// Act 2 · WebGL: the coral point igniting at the origin, shockwaves in the ring plane (ignite + lock), the dust
// falling into orbital rings (shared storm), the benefit orbit drawing in, and the three benefit satellites
// streaking in along it to lock on their beats — then all of it sucked into the coral satellite before the dive.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {C} from '../../brand';
import {useGLFrame} from '../../engine/gl';
import {Glow3D} from '../../engine/glow';
import {lerp3, type V3} from '../../engine/math';
import {planetForm, RING_OFF, RING_R, RING_ROLL, RING_TILT, satPos} from '../../shell/orbit';
import {StoryDust} from '../chaos/storm';
import {BEN_PSI, T0, benPoint} from '../chaos/story';
import {clamp, ease, prog} from '../chaos/util';
import {BENEFITS, LOCK, RELAYOUT, SUCK} from './timing';

export const Shock: React.FC<{f: number; at: number; color: string; r0: number; r1: number; dur: number; w: number; k?: number}> = ({f, at, color, r0, r1, dur, w, k = 1}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide}), [color]);
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const e = ease.expoOut(t / dur);
  const r = r0 + (r1 - r0) * e;
  mat.opacity = (1 - e) ** 1.5 * k;
  mat.color.set(color).multiplyScalar(2.2);
  return (
    <group position={RING_OFF} rotation={[0, 0, RING_ROLL]}>
      <mesh rotation={[-(Math.PI / 2 - RING_TILT), 0, 0]} material={mat} renderOrder={12}>
        <ringGeometry args={[r - w * (1 - 0.7 * e), r, 160]} />
      </mesh>
    </group>
  );
};

const BenefitOrbit: React.FC<{draw: number; op: number}> = ({draw, op}) => {
  const line = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 200; i++) pts.push(...benPoint(-1.35 + (2.7 * i) / 200));
    const geo = new LineGeometry();
    geo.setPositions(pts);
    const mat = new LineMaterial({color: new THREE.Color(C.sky).multiplyScalar(1.3), linewidth: 2, transparent: true, depthWrite: false, worldUnits: false});
    mat.resolution.set(1920, 1080);
    const l = new Line2(geo, mat);
    l.frustumCulled = false;
    l.renderOrder = 11;
    return l;
  }, []);
  (line.material as LineMaterial).opacity = op;
  line.geometry.instanceCount = Math.max(0, Math.floor(200 * draw));
  line.visible = op > 0.003 && draw > 0.003;
  return <primitive object={line} />;
};

const BenefitSat: React.FC<{i: number; f: number; g: number}> = ({i, f, g}) => {
  const b = BENEFITS[i];
  const mat = useMemo(() => new THREE.MeshStandardMaterial({color: b.color, emissive: b.color, emissiveIntensity: 1.6, roughness: 0.3}), [b.color]);
  if (f < b.f - 26) return null;
  const arrive = ease.cubicOut(prog(f, b.f - 26, b.f));
  const psi = BEN_PSI[i] - 1.1 * (1 - arrive);
  const bob: V3 = [0, 40 * Math.sin(0.05 * f + i * 2), 0];
  const home = benPoint(psi);
  const k = ease.cubicIn(prog(f, SUCK + 6 * i, SUCK + 34 + 6 * i));
  if (k >= 1) return null;
  const p = lerp3([home[0] + bob[0], home[1] + bob[1], home[2]], satPos(g), k);
  const flash = f >= b.f ? Math.exp(-(f - b.f) / 10) : 0;
  return (
    <group position={p}>
      <mesh material={mat} scale={1 - 0.8 * k}>
        <sphereGeometry args={[105, 32, 24]} />
      </mesh>
      <Glow3D size={1100 * (1 - 0.6 * k)} color={b.color} opacity={0.75 * clamp(arrive * 2)} intensity={1.3} />
      <Glow3D size={3200} color={b.color} opacity={0.9 * flash} intensity={1.4} />
      {/* streak tail while it travels in */}
      {arrive < 1 ? <Glow3D size={700} color="#ffffff" opacity={0.6 * (1 - arrive)} intensity={1.5} /> : null}
    </group>
  );
};

export const GL: React.FC = () => {
  const f = useGLFrame();
  const g = f + T0;
  const form = planetForm(g);
  const ignite = f >= 0 ? 1 : 0;
  const pulse = 1 + 0.12 * Math.sin(f * 0.35);
  const core = ignite * (1 - form) * clamp((f + 1) / 3);
  const flash = f >= 0 ? Math.exp(-f / 6) : 0;
  const lockFlash = f >= LOCK ? Math.exp(-(f - LOCK) / 10) : 0;
  const draw = ease.cubicInOut(prog(f, RELAYOUT[0] + 10, RELAYOUT[1] + 30));
  const orbitOp = 0.5 * (1 - ease.cubicIn(prog(f, SUCK, SUCK + 40)));
  return (
    <>
      <StoryDust g={g} from={T0} to={1330} />
      {core > 0.003 ? (
        <>
          <Glow3D size={360 * pulse} color="#ffffff" opacity={core} intensity={3} />
          <Glow3D size={900 * pulse} color={C.coral} opacity={core} intensity={2.6} />
          <Glow3D size={5200} color={C.coral} opacity={0.42 * core} />
        </>
      ) : null}
      {flash > 0.01 ? <Glow3D size={9000} color="#ff9a78" opacity={0.75 * flash} intensity={1.3} /> : null}
      {lockFlash > 0.01 ? (
        <>
          <Glow3D size={11000} color="#7f9dff" opacity={lockFlash} intensity={1.4} />
          <Glow3D size={4200} color="#ffffff" opacity={0.8 * lockFlash} intensity={1.6} />
        </>
      ) : null}
      <Shock f={f} at={0} color={C.coral} r0={200} r1={9000} dur={64} w={260} />
      <Shock f={f} at={LOCK} color={C.coral} r0={RING_R} r1={11000} dur={56} w={300} />
      <Shock f={f} at={LOCK + 5} color="#ffffff" r0={RING_R} r1={8000} dur={50} w={120} k={0.8} />
      <BenefitOrbit draw={draw} op={orbitOp} />
      {BENEFITS.map((_, i) => (
        <BenefitSat key={i} i={i} f={f} g={g} />
      ))}
    </>
  );
};
