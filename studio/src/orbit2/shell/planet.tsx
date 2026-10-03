// The Orbit planet in WebGL, built to read like the logo: a glossy cobalt sphere (clearcoat, top-left softbox
// highlight, bright-cyan fresnel rim), a chrome ring and the glossy coral satellite. Lit by its own studio
// environment, which is rigged to the camera (envMapRotation) so the brand object reads the same from every
// station — highlight top-left, rim lower-right — exactly as in the PNG at the lock.
import React, {useLayoutEffect, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {cameraAt} from '../engine/camera';
import {makeCamera} from '../engine/space';
import {Glow3D} from '../engine/glow';
import {PR, RING_OFF, RING_R, RING_ROLL, RING_TILT, RING_TUBE, SAT_R, planetForm, ringForm, satPos, satState} from './orbit';

/** Studio environment for the brand object (authored for a camera on +z looking at the origin). */
const useStudioEnv = () => {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    const sc = new THREE.Scene();
    sc.background = new THREE.Color('#02040f');
    const panel = (w: number, h: number, p: [number, number, number], color: string, k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide}));
      m.position.set(...p);
      m.lookAt(0, 0, 0);
      sc.add(m);
    };
    panel(5.5, 3.6, [-7, 8, 9], '#ffffff', 3.4); // soft key, upper left front (the logo's highlight)
    panel(2.2, 1.1, [-3, 5, 10], '#ffffff', 8); // its hot core
    panel(20, 1.2, [6, -2, -9], '#9fc4ff', 2.4); // cool rim strip behind right
    panel(14, 0.8, [-10, -3, -4], '#5d7dff', 1.6); // cobalt bounce, low left
    panel(5, 3, [9, 6, 3], '#ff8a62', 1.8); // coral card on the satellite side
    panel(30, 0.9, [0, 11, -2], '#dfe9ff', 1.3); // overhead strip (chrome line on the ring)
    panel(30, 5, [0, -12, 0], '#0a1650', 1.0); // navy floor bounce
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(sc, 0.03);
    pm.dispose();
    return rt.texture;
  }, [gl]);
};

const rimPatch = (rim: THREE.Color, body: [THREE.Color, THREE.Color] | null) => (sh: THREE.WebGLProgramParametersWithUniforms) => {
  sh.uniforms.uRim = {value: rim};
  sh.uniforms.uDeep = {value: body ? body[0] : new THREE.Color(0, 0, 0)};
  sh.uniforms.uBright = {value: body ? body[1] : new THREE.Color(0, 0, 0)};
  sh.fragmentShader =
    'uniform vec3 uRim;\nuniform vec3 uDeep;\nuniform vec3 uBright;\n' +
    sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      /* glsl */ `#include <emissivemap_fragment>
      vec3 oN = normalize(normal);
      float oV = clamp(dot(oN, normalize(vViewPosition)), 0.0, 1.0);
      // body glow: brighter toward the top-left (the logo's lit side), deep toward the lower right
      float oLit = clamp(dot(oN, normalize(vec3(-0.5, 0.62, 0.6))) * 0.5 + 0.5, 0.0, 1.0);
      totalEmissiveRadiance += mix(uDeep, uBright, pow(oLit, 1.7)) * (0.55 + 0.45 * oV);
      // fresnel rim, strongest lower right (the logo's bounce)
      float oF = pow(1.0 - oV, 3.2);
      float oSide = clamp(dot(oN.xy, normalize(vec2(0.7, -0.7))) * 0.5 + 0.6, 0.0, 1.0);
      totalEmissiveRadiance += uRim * oF * oSide;`,
    );
};

/** Camera-rigged env rotation: express world reflection vectors in camera space. */
const rigEnv = (mats: THREE.MeshPhysicalMaterial[], q: THREE.Quaternion) => {
  const f = new THREE.Euler().setFromQuaternion(q.clone().invert());
  for (const m of mats) m.envMapRotation.set(-f.x, -f.y, -f.z, f.order);
};

export const Planet: React.FC = () => {
  const g = useCurrentFrame();
  const env = useStudioEnv();
  const mats = useMemo(() => {
    const planet = new THREE.MeshPhysicalMaterial({
      color: '#0a2fb8',
      roughness: 0.32,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMap: env,
      envMapIntensity: 0.95,
      specularIntensity: 0.22,
      emissive: '#000000',
    });
    planet.onBeforeCompile = rimPatch(new THREE.Color(0.14, 0.42, 1.25), [new THREE.Color(0.0, 0.005, 0.14), new THREE.Color(0.0, 0.13, 0.9)]);
    const ring = new THREE.MeshPhysicalMaterial({color: '#e9eef7', metalness: 1, roughness: 0.14, envMap: env, envMapIntensity: 1.55, clearcoat: 0.6, clearcoatRoughness: 0.08, transparent: true});
    const sat = new THREE.MeshPhysicalMaterial({color: '#ff4f22', roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.05, envMap: env, envMapIntensity: 1.0, emissive: '#000000'});
    sat.onBeforeCompile = rimPatch(new THREE.Color(1.0, 0.55, 0.4), [new THREE.Color(0.25, 0.03, 0.005), new THREE.Color(1.0, 0.22, 0.07)]);
    const atmo = new THREE.ShaderMaterial({
      uniforms: {uColor: {value: new THREE.Color(0.12, 0.3, 1.0)}, uK: {value: 1}},
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'uniform vec3 uColor; uniform float uK; varying vec3 vN; varying vec3 vV; void main(){ float d = abs(dot(normalize(vN), normalize(vV))); float a = pow(d, 2.6) * 0.75; gl_FragColor = vec4(uColor * a * uK, 1.0); }',
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    return {planet, ring, sat, atmo};
  }, [env]);

  const cam = cameraAt(g);
  useLayoutEffect(() => {
    rigEnv([mats.planet, mats.ring, mats.sat], makeCamera(cam).quaternion);
  }, [cam, mats]);

  const form = planetForm(g);
  const rf = ringForm(g);
  const st = satState(g);
  const sp = satPos(g);
  mats.ring.opacity = rf;
  mats.ring.depthWrite = rf > 0.98;
  mats.atmo.uniforms.uK.value = form;
  if (form <= 0.001) return null;
  return (
    <group>
      <mesh scale={form} material={mats.planet} renderOrder={1}>
        <sphereGeometry args={[PR, 128, 96]} />
      </mesh>
      <mesh scale={form * 1.2} material={mats.atmo} renderOrder={2}>
        <sphereGeometry args={[PR, 64, 48]} />
      </mesh>
      <Glow3D size={PR * 7 * form} color="#2a52ff" opacity={0.32} renderOrder={0} />
      {rf > 0.002 ? (
        <group position={RING_OFF} rotation={[0, 0, RING_ROLL]}>
          <group rotation={[-(Math.PI / 2 - RING_TILT), 0, 0]} scale={1 + 0.55 * (1 - rf) ** 2}>
            <mesh material={mats.ring} renderOrder={3}>
              <torusGeometry args={[RING_R, RING_TUBE, 40, 320]} />
            </mesh>
          </group>
        </group>
      ) : null}
      {st.vis > 0.001 ? (
        <group position={sp}>
          <mesh scale={st.scale} material={mats.sat} renderOrder={4}>
            <sphereGeometry args={[SAT_R, 64, 48]} />
          </mesh>
          <Glow3D size={SAT_R * 7 * st.scale} color="#ff6a3d" opacity={0.42 * st.vis} />
        </group>
      ) : null}
    </group>
  );
};
