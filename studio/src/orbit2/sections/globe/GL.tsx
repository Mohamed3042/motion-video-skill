// Station 2 · WebGL set: a stereokinetic disc (flat, nested, tangent circles turning on a plate — it reads as a
// dome/sphere) that inflates into a real lit globe on the hit, with the EG / KW / SA admin outlines in cyan.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Line} from '@react-three/drei';
import {useGLFrame} from '../../engine/gl';
import {clamp, prog, smooth, smoother} from '../../engine/math';
import {C} from '../../brand';
import {Dust, Glow, Nebula, StationLights} from '../profile/gl3';
import {GEO} from './geo';
import {collapseAt, COUNTRIES, dir, inflateAt, onGlobe, RG, selAt, T, viewAt} from './scene';

const TAU = Math.PI * 2;
const D = Math.PI / 180;

let DISC: THREE.CanvasTexture | null = null;
const discTex = () => {
  if (DISC) return DISC;
  const N = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  const R = N / 2 - 4;
  const NC = 11;
  // nested circles, all tangent at one side: turning, they read as a 3D dome (stereokinetic effect)
  for (let i = 0; i <= NC; i++) {
    const u = i / (NC + 1);
    const r = R * Math.sqrt(1 - u * u) * (1 - 0.06 * u);
    const d = R - r;
    g.beginPath();
    g.arc(N / 2 + d, N / 2, r, 0, TAU);
    g.fillStyle = i % 2 ? '#132f86' : '#0b1d5e';
    g.fill();
    g.lineWidth = i === 0 ? 10 : 6;
    g.strokeStyle = i % 2 ? '#89b7ff' : '#d4e4ff';
    g.stroke();
  }
  DISC = new THREE.CanvasTexture(c);
  DISC.colorSpace = THREE.SRGBColorSpace;
  DISC.anisotropy = 8;
  return DISC;
};

let GLOBE: THREE.CanvasTexture | null = null;
const globeTex = () => {
  if (GLOBE) return GLOBE;
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#0a1a55');
  grd.addColorStop(0.5, '#10298a');
  grd.addColorStop(1, '#0a1a55');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(137,183,255,0.2)';
  g.lineWidth = 1.5;
  for (let lon = -180; lon <= 180; lon += 15) {
    g.beginPath();
    g.moveTo(((lon + 180) / 360) * W, 0);
    g.lineTo(((lon + 180) / 360) * W, H);
    g.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    g.beginPath();
    g.moveTo(0, ((90 - lat) / 180) * H);
    g.lineTo(W, ((90 - lat) / 180) * H);
    g.stroke();
  }
  g.fillStyle = 'rgba(137,183,255,0.32)';
  for (const id of ['EG', 'KW', 'SA'] as const)
    for (const ring of GEO[id]) {
      g.beginPath();
      for (let i = 0; i < ring.length; i += 2) {
        const x = ((ring[i] + 180) / 360) * W;
        const y = ((90 - ring[i + 1]) / 180) * H;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.closePath();
      g.fill();
    }
  GLOBE = new THREE.CanvasTexture(c);
  GLOBE.colorSpace = THREE.SRGBColorSpace;
  GLOBE.anisotropy = 8;
  return GLOBE;
};

const RINGS3D = (['EG', 'KW', 'SA'] as const).map((id) =>
  GEO[id].map((ring) => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < ring.length; i += 2) {
      const v = dir(ring[i], ring[i + 1]);
      pts.push([v[0] * RG * 1.004, v[1] * RG * 1.004, v[2] * RG * 1.004]);
    }
    pts.push(pts[0]);
    return pts;
  }),
);

export const GL: React.FC = () => {
  const f = useGLFrame();
  const disc = useMemo(discTex, []);
  const globe = useMemo(globeTex, []);
  const inf = inflateAt(f);
  const col = collapseAt(f);
  const v = viewAt(f);
  const sel = selAt(f);
  const discA = 1 - smooth(prog(f, T.inflate + 2, T.inflate + 22));
  const globeA = smooth(prog(f, T.inflate - 2, T.inflate + 8));
  const arrive = f >= 0 ? Math.exp(-f / 14) : 0;
  const selPulse = (k: number) => {
    const at = [T.scope + 22, T.kw, T.sa][k];
    return f >= at ? Math.exp(-(f - at) / 20) : 0;
  };
  const exit = prog(f, T.out + 10, T.out + 50);
  return (
    <group>
      <StationLights accent={C.sky} power={1.9} />
      <Nebula color={C.sky} p={[-600, 700, -6400]} size={11000} opacity={0.15} />

      {/* the stereokinetic disc: a flat plate whose circles turn */}
      {discA > 0.01 ? (
        <group rotation={[0, 0, -f * 0.05]}>
          <mesh>
            <circleGeometry args={[RG, 160]} />
            <meshStandardMaterial map={disc} emissiveMap={disc} emissive="#ffffff" emissiveIntensity={0.8 + 0.6 * arrive} roughness={0.5} metalness={0.2} transparent opacity={discA} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -9]}>
            <cylinderGeometry args={[RG, RG, 18, 160, 1, true]} />
            <meshStandardMaterial color="#5f86d8" emissive={C.sky} emissiveIntensity={0.35} roughness={0.3} metalness={0.6} transparent opacity={discA} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : null}
      <Glow size={RG * (2.7 + 1.5 * arrive)} color={C.sky} opacity={(0.22 + 0.5 * arrive) * col} p={[0, 0, -RG * 0.6]} />

      {/* the real globe */}
      {globeA > 0.01 && col > 0.01 ? (
        <group scale={[col, col, col * inf]}>
          <group rotation={[v.lat * D, -(90 + v.lon) * D, 0]}>
            <mesh>
              <sphereGeometry args={[RG, 128, 96]} />
              <meshStandardMaterial map={globe} emissiveMap={globe} emissive="#ffffff" emissiveIntensity={0.34} roughness={0.75} metalness={0.08} transparent={globeA < 1} opacity={globeA} />
            </mesh>
            {RINGS3D.map((rings, k) =>
              rings.map((pts, j) => (
                <Line key={`${k}-${j}`} points={pts} color={k === sel ? '#e6f0ff' : C.sky} lineWidth={k === sel ? 2.4 : 1.3} transparent opacity={globeA * (k === sel ? 1 : 0.75)} toneMapped={false} />
              )),
            )}
          </group>
        </group>
      ) : null}
      {/* atmosphere rim */}
      {globeA > 0.01 ? <Glow size={RG * 2.5} color={C.sky} opacity={0.32 * globeA * col * clamp(inf)} p={[0, 0, -RG * 0.2]} /> : null}

      {/* scope glow on the selected country (a soft region, never a pin) */}
      {COUNTRIES.map((c, k) => {
        const on = k === sel ? 1 : 0;
        const a = (0.35 * on + 0.6 * selPulse(k)) * globeA * smoother(prog(f, T.scope + 10, T.scope + 30));
        return <Glow key={c.id} p={onGlobe(c.lon, c.lat, f, 1.03)} size={k === 1 ? 150 : 260} color={C.sky} opacity={a} />;
      })}

      {/* exit: the globe collapses into a point that flares */}
      {exit > 0 ? (
        <>
          <Glow size={140 + 900 * Math.sin(Math.PI * exit)} color="#dce8ff" opacity={Math.sin(Math.PI * clamp(exit * 1.2))} />
          <Glow size={2400 * Math.sin(Math.PI * exit)} color={C.good} opacity={0.4 * Math.sin(Math.PI * exit)} sx={2.4} />
        </>
      ) : null}

      <Dust f={f} seed={21} n={420} box={[-3000, 3400, -1800, 2000, -4000, 2600]} color={C.sky} size={15} opacity={0.5} />
    </group>
  );
};
