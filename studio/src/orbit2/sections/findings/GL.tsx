// Station 3 · WebGL set: the lilac chaser as twelve real glass lanterns in front of a grey lens. One is always
// dark; the eye paints a green dot in the gap that is never drawn. On the hit the dark lantern lights MINT for
// real, mint spreads round the ring, and the lanterns fly out to become the carousel's rail lights.
import React from 'react';
import {useGLFrame} from '../../engine/gl';
import {prog, smooth, smoother} from '../../engine/math';
import {C} from '../../brand';
import {mixHex} from '../../shared';
import {Blur, Dust, Glow, Nebula, softDiscTex, StationLights} from '../profile/gl3';
import {gapAt, lanternPos, morphAt, N, RAIL, RC, REAL_GAP, T} from './scene';

const LILAC = '#da94be';

export const GL: React.FC = () => {
  const f = useGLFrame();
  const lens = 1 - smooth(prog(f, T.real + 10, T.real + 50));
  const rail = smooth(prog(f, T.morph[0] + 30, T.morph[1] + 20)) * (1 - smooth(prog(f, T.out + 10, T.out + 50)));
  const born = f >= T.real ? Math.exp(-(f - T.real) / 16) : 0;
  return (
    <group>
      <StationLights accent={C.good} power={1.5} />
      <Nebula color={C.good} p={[300, 800, -6400]} size={10500} opacity={0.13} />

      {/* the grey lens the chaser needs (the after-image reads on neutral grey) */}
      {lens > 0.01 ? (
        <mesh position={[0, 0, -70]} renderOrder={6}>
          <planeGeometry args={[1080, 1080]} />
          <meshBasicMaterial map={softDiscTex()} color="#868ba8" transparent opacity={0.94 * lens} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}

      {Array.from({length: N}, (_, i) => {
        const p = lanternPos(i, f);
        const d = Math.min(Math.abs(i - REAL_GAP), N - Math.abs(i - REAL_GAP));
        const mint = f < T.real ? 0 : i === REAL_GAP ? 1 : smoother(prog(f, T.real + 6 + d * 3.5, T.real + 22 + d * 3.5));
        const off = f < T.real && i === gapAt(f);
        const col = mixHex(LILAC, C.good, mint);
        const m = morphAt(i, f);
        return (
          <group key={i} position={p}>
            <mesh>
              <sphereGeometry args={[30 - 16 * m, 24, 16]} />
              <meshStandardMaterial color={off ? '#30355a' : col} emissive={off ? '#0b0e26' : col} emissiveIntensity={off ? 0.2 : 1.1} roughness={0.25} metalness={0.3} toneMapped={false} />
            </mesh>
            {!off ? <Blur size={300 - 190 * m} color={col} opacity={(0.95 - 0.4 * mint) * (1 - 0.3 * m)} ro={7} /> : null}
            {mint > 0 ? <Glow size={(260 - 150 * m) * (1 + 3.5 * (i === REAL_GAP ? born : 0))} color={C.good} opacity={0.6 * mint + (i === REAL_GAP ? born : 0)} ro={8} /> : null}
          </group>
        );
      })}

      {/* the carousel rail the lanterns settle on */}
      {rail > 0.01 ? (
        <mesh position={[0, RAIL, -RC]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RC, 2.4, 6, 240]} />
          <meshBasicMaterial color={C.good} transparent opacity={0.55 * rail} toneMapped={false} />
        </mesh>
      ) : null}
      {rail > 0.01 ? <Glow p={[0, RAIL - 40, -RC * 0.15]} size={2600} sx={1.6} color={C.good} opacity={0.12 * rail} /> : null}

      <Dust f={f} seed={31} n={420} box={[-3000, 3200, -1800, 2000, -4200, 2600]} color={C.good} size={14} opacity={0.5} />
    </group>
  );
};
