// The whole 3D stage, built imperatively once and then driven per frame by update(frame).
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  BloomEffect,
  DepthOfFieldEffect,
  Effect,
  EffectComposer,
  EffectPass,
  KawaseBlurPass,
  KernelSize,
  Pass,
  VignetteEffect,
} from 'postprocessing';
import type {Font} from 'opentype.js';
import * as TL from './timeline';
import {buildLayout, makeChoreo, R} from './choreo';
import {createMorph} from './morph';
import {createParticles} from './particles';
import {clamp, easeIn, easeInOut, smoothstep, spring, V3} from './math';

const CREAM = '#EDE9E0';
const ORANGE = '#FF4F1F';
const BG = '#121212';
const F = TL.FPS;

class GrainEffect extends Effect {
  constructor() {
    super(
      'GrainEffect',
      /* glsl */ `
      uniform float seed;
      uniform float amount;
      float h12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec2 q = gl_FragCoord.xy + vec2(seed * 61.7, seed * 17.3);
        float n = h12(q) + h12(q + 7.31) - 1.0;
        // grain is added in display (gamma) space so it stays subtle in the blacks
        vec3 s = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
        float l = dot(s, vec3(0.2126, 0.7152, 0.0722));
        s += n * amount * (0.6 + 0.4 * (1.0 - l));
        outputColor = vec4(pow(max(s, 0.0), vec3(2.2)), inputColor.a);
      }`,
      {
        uniforms: new Map<string, THREE.Uniform>([
          ['seed', new THREE.Uniform(0)],
          ['amount', new THREE.Uniform(0.018)],
        ]),
      },
    );
  }
}

// Hue-preserving soft-knee tone curve: linear through the darks and mids (so the #121212 studio
// and the cream type keep their values), smooth shoulder for HDR glow, hot cores bleach slightly.
class GradeEffect extends Effect {
  constructor() {
    super(
      'GradeEffect',
      /* glsl */ `
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = max(inputColor.rgb, 0.0);
        float m = max(max(c.r, c.g), c.b);
        const float a = 0.62;
        float mo = m < a ? m : a + (1.0 - a) * (1.0 - exp(-(m - a) / (1.0 - a)));
        vec3 o = c * (mo / max(m, 1e-5));
        o = mix(o, vec3(mo), smoothstep(1.2, 10.0, m) * 0.4);
        outputColor = vec4(o, inputColor.a);
      }`,
    );
  }
}

const easingCurves: ((x: number) => number)[] = [
  (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  (x) => 1 - Math.exp(-5.5 * x) * Math.cos(13 * x),
  (x) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  },
];

export const createStage = (font: Font, gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, W: number, H: number) => {
  const L = buildLayout(font);
  const C = makeChoreo(L);
  const root = new THREE.Group();
  const disposables: {dispose: () => void}[] = [];

  // ---------- studio: background, fog, environment, lights ----------
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 24, 70);
  {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0, 0, 0);
    const card = (w: number, h: number, p: V3, color: string, k: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide}),
      );
      m.position.set(...p);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    card(9, 6, [-8, 10, 6], '#ffffff', 5); // large soft key, above left
    card(16, 2.4, [4, 3, -12], '#ff6a2a', 4); // warm rim strip behind
    card(5, 4, [10, 4, 5], '#fff0dc', 0.8); // faint fill
    card(24, 1.4, [0, 13, -3], '#ffffff', 1.6); // overhead strip
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(env, 0.025);
    scene.environment = rt.texture;
    scene.environmentIntensity = 1.0;
    pm.dispose();
    disposables.push(rt);
  }
  // Key and rim are rigged to the camera (like a motion-control light rig): the key always comes
  // from above-left of frame, the warm rim always from behind the subject.
  const key = new THREE.DirectionalLight('#fff4e8', 4.6);
  const rim = new THREE.DirectionalLight('#ff7a3a', 2.6);
  const KEY_DIR = new THREE.Vector3(-0.5, 0.62, 0.6).normalize();
  const RIM_DIR = new THREE.Vector3(0.35, 0.5, -1).normalize();
  const hemi = new THREE.HemisphereLight('#ffffff', '#120c08', 0.06);
  root.add(key, key.target, rim, rim.target, hemi);

  // ---------- reflective floor ----------
  const reflRT = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 4});
  const blurRT = new THREE.WebGLRenderTarget(W / 2, H / 2, {type: THREE.HalfFloatType});
  const kawase = new KawaseBlurPass({kernelSize: KernelSize.LARGE});
  kawase.setSize(W / 2, H / 2);
  disposables.push(reflRT, blurRT, kawase);
  const fu = {
    tRefl: {value: reflRT.texture},
    tReflBlur: {value: blurRT.texture},
    uTexMat: {value: new THREE.Matrix4()},
    uReflStr: {value: 1.0},
    uBlurMix: {value: 0.32},
    uImpacts: {value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()]},
    uSphere: {value: new THREE.Vector4()},
    uGlowCol: {value: new THREE.Color(1.0, 0.3, 0.09)},
  };
  const floorMat = new THREE.MeshPhysicalMaterial({color: '#0b0b0b', roughness: 0.6, metalness: 0, specularIntensity: 0, envMapIntensity: 0});
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, fu);
    sh.vertexShader =
      'uniform mat4 uTexMat;\nvarying vec4 vReflUv;\nvarying vec3 vWPos;\n' +
      sh.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvReflUv = uTexMat * vec4(position, 1.0);\nvWPos = (modelMatrix * vec4(position, 1.0)).xyz;',
      );
    sh.fragmentShader =
      'uniform sampler2D tRefl;\nuniform sampler2D tReflBlur;\nuniform float uReflStr;\nuniform float uBlurMix;\nuniform vec4 uImpacts[3];\nuniform vec4 uSphere;\nuniform vec3 uGlowCol;\nvarying vec4 vReflUv;\nvarying vec3 vWPos;\n' +
      sh.fragmentShader.replace(
        '#include <opaque_fragment>',
        /* glsl */ `
        vec2 rOff = vec2(0.0);
        float ring = 0.0;
        for (int k = 0; k < 3; k++) {
          vec4 im = uImpacts[k];
          if (im.w <= 0.0) continue;
          vec2 dv = vWPos.xz - im.xy;
          float d = length(dv);
          float age = im.z;
          float rad = 4.4 * age + 0.2;
          float x = d - rad;
          float fade = im.w * exp(-2.1 * age) * smoothstep(0.0, 0.03, age);
          ring += exp(-x * x / (0.012 + 0.05 * age)) * fade;
          float r2 = d - rad * 0.6;
          ring += 0.4 * exp(-r2 * r2 / (0.01 + 0.03 * age)) * fade * smoothstep(0.08, 0.35, age);
          float wave = sin(x * 15.0) * exp(-abs(x) * 2.0) * fade;
          rOff += dv / max(d, 1e-3) * wave * 0.02;
        }
        vec4 ruv = vReflUv;
        ruv.xy += rOff * ruv.w;
        vec3 rS = texture2DProj(tRefl, ruv).rgb;
        vec3 rB = texture2DProj(tReflBlur, ruv).rgb;
        vec3 refl = mix(rS, rB, uBlurMix);
        float ndv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        float fres = 0.3 + 0.7 * pow(1.0 - ndv, 5.0);
        outgoingLight += refl * fres * uReflStr;
        float hh = max(uSphere.y, 0.05);
        float dg = length(vWPos.xz - uSphere.xz);
        outgoingLight += uGlowCol * uSphere.w * hh / pow(hh * hh + dg * dg, 1.5);
        outgoingLight += uGlowCol * ring * 2.6;
        #include <opaque_fragment>`,
      );
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  root.add(floor);

  // ---------- materials ----------
  // The sphere's warm light on the type: a diffuse-only point-light term (a real PointLight would put
  // pin-sharp orange specks on the glossy clearcoat).
  const glowU = {uGlowPos: {value: new THREE.Vector3()}, uGlowI: {value: 0}, uGlowCol: {value: new THREE.Color(1.0, 0.36, 0.12)}};
  const cream = () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: CREAM,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.17,
      specularIntensity: 0.7,
      envMapIntensity: 1.0,
      emissive: ORANGE,
      emissiveIntensity: 0,
    });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, glowU);
      sh.vertexShader =
        'varying vec3 vGWPos;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvGWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader =
        'uniform vec3 uGlowPos;\nuniform float uGlowI;\nuniform vec3 uGlowCol;\nvarying vec3 vGWPos;\n' +
        sh.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `#include <emissivemap_fragment>
          vec3 gD = uGlowPos - vGWPos;
          float gd2 = dot(gD, gD);
          vec3 gN = inverseTransformDirection(normal, viewMatrix);
          totalEmissiveRadiance += diffuseColor.rgb * uGlowCol * uGlowI * max(dot(gN, gD * inversesqrt(gd2)), 0.0) / (gd2 + 0.12);`,
        );
    };
    return m;
  };
  const motionMat = cream();
  const ringMat = cream();
  const titleMat = cream();
  const glass = new THREE.MeshPhysicalMaterial({
    color: ORANGE,
    transmission: 1,
    thickness: 1.1,
    ior: 1.5,
    roughness: 0.04,
    attenuationColor: new THREE.Color('#ff3c10'),
    attenuationDistance: 0.9,
    emissive: ORANGE,
    emissiveIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1,
    envMapIntensity: 1.5,
  });
  // soft internal light: emission strongest through the thick centre, fading toward the rim
  glass.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      /* glsl */ `#include <emissivemap_fragment>
      float gNdv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
      totalEmissiveRadiance *= 0.04 + 1.6 * pow(gNdv, 3.5);
      // refracted key light focusing on the far side: a warm crescent low-right inside the glass
      float gC = pow(max(dot(normalize(normal.xy + 1e-4), vec2(0.62, -0.78)), 0.0), 3.0);
      totalEmissiveRadiance += vec3(1.0, 0.42, 0.12) * gC * smoothstep(0.12, 0.5, gNdv) * (1.0 - smoothstep(0.62, 0.95, gNdv)) * 1.3;`,
    );
  };

  // ---------- hero sphere / morph ----------
  const morph = createMorph();
  const heroGroup = new THREE.Group();
  heroGroup.matrixAutoUpdate = false;
  const heroMesh = new THREE.Mesh(morph.geom, glass);
  heroGroup.add(heroMesh);
  root.add(heroGroup);

  // ---------- MOTION ----------
  const motionMeshes = L.motion.map((p) => {
    const m = new THREE.Mesh(p.g.geom, motionMat);
    m.position.set(...p.pos);
    m.rotation.y = p.rotY;
    root.add(m);
    return m;
  });

  // ---------- frosted panels with easing curves ----------
  const panelGeo = new RoundedBoxGeometry(2.7, 1.75, 0.07, 4, 0.1);
  const panelMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.42,
    transmission: 1,
    thickness: 0.15,
    ior: 1.45,
    specularIntensity: 0.9,
    envMapIntensity: 1.1,
    emissive: '#2b2825',
    emissiveIntensity: 1,
  });
  const lineMat = new THREE.MeshBasicMaterial({color: new THREE.Color(5.0, 1.35, 0.38)});
  // a fine luminous rim so the frosted sheet reads as glass against the black studio
  const rimShape = new THREE.Shape();
  {
    const w = 1.35;
    const h = 0.875;
    const c = 0.1;
    rimShape.moveTo(-w + c, -h);
    rimShape.lineTo(w - c, -h);
    rimShape.quadraticCurveTo(w, -h, w, -h + c);
    rimShape.lineTo(w, h - c);
    rimShape.quadraticCurveTo(w, h, w - c, h);
    rimShape.lineTo(-w + c, h);
    rimShape.quadraticCurveTo(-w, h, -w, h - c);
    rimShape.lineTo(-w, -h + c);
    rimShape.quadraticCurveTo(-w, -h, -w + c, -h);
  }
  const rimCurve = new THREE.CatmullRomCurve3(rimShape.getSpacedPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0.036)), true);
  const rimGeo = new THREE.TubeGeometry(rimCurve, 320, 0.007, 6, true);
  const rimMat = new THREE.MeshBasicMaterial({color: new THREE.Color(0.75, 0.68, 0.6)});
  const panelDefs: {pos: V3; from: number; to: number}[] = [
    {pos: [3.0, 6.0, C.A[2] - 3.0], from: -8, to: -10},
    {pos: [4.8, 3.45, C.A[2] + 2.3], from: 8, to: 10},
    {pos: [6.8, 6.6, C.A[2] + 4.6], from: 9, to: 11},
  ];
  const SEG = 180;
  const panels = panelDefs.map((d, i) => {
    const g = new THREE.Group();
    g.rotation.y = -Math.PI / 2 + (i - 1) * 0.08;
    const box = new THREE.Mesh(panelGeo, panelMat);
    g.add(box, new THREE.Mesh(rimGeo, rimMat));
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 120; s++) {
      const x = s / 120;
      pts.push(new THREE.Vector3(-1.05 + 2.1 * x, -0.5 + 0.95 * easingCurves[i](x), 0.06));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.022, 8, false), lineMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), lineMat);
    g.add(tube, head);
    root.add(g);
    return {g, tube, head, curve, d};
  });

  // ---------- ring of words ----------
  const ringGroup = new THREE.Group();
  ringGroup.position.set(...C.A);
  const ringItems = L.ring.map((it) => {
    const pivot = new THREE.Group();
    const holder = new THREE.Group();
    holder.position.set(0, -0.34, L.ringR);
    const m = new THREE.Mesh(it.g.geom, ringMat);
    m.position.x = -it.cx;
    holder.add(m);
    pivot.add(holder);
    ringGroup.add(pivot);
    // exit order: letters on the far side (seen behind the sphere) leave first, the ones framing the
    // gap the camera flies through leave last
    const atCross = Math.atan2(Math.sin(it.beta + C.ringAngle(15 * F)), Math.cos(it.beta + C.ringAngle(15 * F)));
    return {pivot, holder, beta: it.beta, exitDelay: -22 * (Math.abs(atCross) / Math.PI) + 4};
  });
  root.add(ringGroup);

  // ---------- title ----------
  const titleMeshes = L.title.map((p) => {
    const m = new THREE.Mesh(p.g.geom, titleMat);
    m.position.set(...p.pos);
    root.add(m);
    return m;
  });

  // ---------- particles ----------
  const particles = createParticles(L, C);
  root.add(particles.mesh);

  // ---------- post ----------
  const composer = new EffectComposer(gl, {frameBufferType: THREE.HalfFloatType, multisampling: 8});
  // Real shutter motion blur: the scene is re-posed at sub-frame times (everything is a pure function of
  // the frame) and the HDR renders are averaged before DOF / bloom / grade. The centre sample is
  // rendered last, straight into the composer's buffer, so depth (for DOF) and the camera match frame f.
  const sampleRT = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 8});
  const accumRT = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, depthBuffer: false});
  disposables.push(sampleRT, accumRT);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadMat = (blend: boolean) =>
    new THREE.ShaderMaterial({
      uniforms: {tex: {value: null}, w: {value: 1}},
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
      depthTest: false,
      depthWrite: false,
      blending: blend ? THREE.CustomBlending : THREE.NoBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    });
  const accMat = quadMat(true);
  const copyMat = quadMat(false);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const SHUTTER = 0.5; // 180 degrees
  const OFFSETS = [-0.25, -0.125, 0.125, 0.25, 0].map((o) => o * (SHUTTER / 0.5));
  let current = 0;
  class MotionBlurRenderPass extends Pass {
    constructor() {
      super('MotionBlurRenderPass');
      this.needsSwap = false;
    }
    render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget) {
      OFFSETS.forEach((off, k) => {
        apply(current + off, SHUTTER / (OFFSETS.length - 1));
        renderReflection();
        const target = k === OFFSETS.length - 1 ? inputBuffer : sampleRT;
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(scene, camera);
        quad.material = accMat;
        accMat.uniforms.tex.value = target.texture;
        accMat.uniforms.w.value = 1 / OFFSETS.length;
        renderer.setRenderTarget(accumRT);
        if (k === 0) renderer.clear();
        renderer.render(quadScene, quadCam);
      });
      quad.material = copyMat;
      copyMat.uniforms.tex.value = accumRT.texture;
      renderer.setRenderTarget(inputBuffer);
      renderer.render(quadScene, quadCam);
    }
  }
  composer.addPass(new MotionBlurRenderPass());
  const dof = new DepthOfFieldEffect(camera, {focusDistance: 8, focusRange: 3.2, bokehScale: 2.5, resolutionScale: 0.5});
  dof.target = new THREE.Vector3();
  const bloom = new BloomEffect({mipmapBlur: true, intensity: 0.75, luminanceThreshold: 1.0, luminanceSmoothing: 0.35, radius: 0.7});
  const tone = new GradeEffect();
  const vignette = new VignetteEffect({offset: 0.3, darkness: 0.52});
  const grain = new GrainEffect();
  composer.addPass(new EffectPass(camera, dof));
  composer.addPass(new EffectPass(camera, bloom, tone, vignette, grain));
  composer.setSize(W, H);
  disposables.push(composer);

  // ---------- reflection camera (mirror about y = 0 with an oblique near plane) ----------
  const vcam = new THREE.PerspectiveCamera();
  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const clipPlane = new THREE.Plane();
  const qv = new THREE.Vector4();
  const cv = new THREE.Vector4();
  const renderReflection = () => {
    camera.updateMatrixWorld();
    const cp = camera.position;
    const dirv = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    vcam.position.set(cp.x, -cp.y, cp.z);
    vcam.up.set(upv.x, -upv.y, upv.z);
    vcam.lookAt(cp.x + dirv.x, -(cp.y + dirv.y), cp.z + dirv.z);
    vcam.far = camera.far;
    vcam.near = camera.near;
    vcam.updateMatrixWorld();
    vcam.projectionMatrix.copy(camera.projectionMatrix);
    fu.uTexMat.value.copy(bias).multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse).multiply(floor.matrixWorld);
    // oblique clipping so nothing below the floor ends up in the reflection
    clipPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
    clipPlane.applyMatrix4(vcam.matrixWorldInverse);
    cv.set(clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant);
    const pe = vcam.projectionMatrix.elements;
    qv.set((Math.sign(cv.x) + pe[8]) / pe[0], (Math.sign(cv.y) + pe[9]) / pe[5], -1, (1 + pe[10]) / pe[14]);
    cv.multiplyScalar(2 / cv.dot(qv));
    pe[2] = cv.x;
    pe[6] = cv.y;
    pe[10] = cv.z + 1;
    pe[14] = cv.w;
    vcam.projectionMatrixInverse.copy(vcam.projectionMatrix).invert();
    floor.visible = false;
    gl.setRenderTarget(reflRT);
    gl.clear();
    gl.render(scene, vcam);
    kawase.render(gl, reflRT, blurRT);
    gl.setRenderTarget(null);
    floor.visible = true;
  };

  // ---------- per-frame update ----------
  const m4 = new THREE.Matrix4();
  const mS = new THREE.Matrix4();
  const vdir = new THREE.Vector3();
  // Pose the whole world at (float) frame f. `streak` = shutter slice per sample, for particle streaks.
  const apply = (f: number, streak: number) => {
    // camera
    const cam = C.camera(f);
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.tgt);
    if (camera.fov !== cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    key.target.position.set(...cam.tgt);
    key.position.copy(KEY_DIR).applyQuaternion(camera.quaternion).multiplyScalar(30).add(key.target.position);
    rim.target.position.set(...cam.tgt);
    rim.position.copy(RIM_DIR).applyQuaternion(camera.quaternion).multiplyScalar(30).add(rim.target.position);

    // hero sphere: position, squash & stretch, velocity stretch, morph
    const p = C.heroPos(f);
    const pa = C.heroPos(f - 0.5);
    const pb = C.heroPos(f + 0.5);
    vdir.set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]);
    const speed = vdir.length() * F;
    const {sy, pin} = C.squashAt(f);
    const vis = C.heroScale(f);
    const r = C.heroRadius(f) * vis;
    heroGroup.visible = vis > 0.001;
    const st = 1 + Math.min(0.18, speed * 0.006); // animation smear; true blur comes from the shutter
    m4.makeTranslation(p[0], p[1] - r * (1 - sy) * pin, p[2]);
    if (speed > 0.01) {
      vdir.normalize();
      const k = 1 / Math.sqrt(st);
      // k*I + (st - k) * v v^T
      mS.set(
        k + (st - k) * vdir.x * vdir.x, (st - k) * vdir.x * vdir.y, (st - k) * vdir.x * vdir.z, 0,
        (st - k) * vdir.y * vdir.x, k + (st - k) * vdir.y * vdir.y, (st - k) * vdir.y * vdir.z, 0,
        (st - k) * vdir.z * vdir.x, (st - k) * vdir.z * vdir.y, k + (st - k) * vdir.z * vdir.z, 0,
        0, 0, 0, 1,
      );
      m4.multiply(mS);
    }
    const sxz = 1 / Math.sqrt(Math.max(0.3, sy));
    m4.multiply(mS.makeScale(sxz * r, sy * r, sxz * r));
    heroGroup.matrix.copy(m4);
    heroGroup.matrixWorldNeedsUpdate = true;
    // rolling: angle follows distance travelled; settles to a full turn by the apex
    const rollL = C.heroPos(TL.LAUNCH)[2] / R;
    const rollEnd = Math.ceil(rollL / (2 * Math.PI)) * 2 * Math.PI;
    heroMesh.rotation.x = f < TL.LAUNCH ? p[2] / R : f < TL.APEX ? rollL + (rollEnd - rollL) * easeInOut((f - TL.LAUNCH) / (TL.APEX - TL.LAUNCH)) : 0;
    heroMesh.rotation.y = f >= TL.APEX ? 0.14 * Math.sin((2 * Math.PI * (f - TL.APEX)) / 360) : 0;
    morph.update(f);
    glass.emissiveIntensity = 0.7 + 4 * (vis - 1 > 0 ? vis - 1 : 0) + 1.6 * Math.exp(-Math.abs(f - TL.IMPACT) / 5) * (f >= TL.IMPACT ? 1 : 0);

    // the sphere's warm light on nearby type
    glowU.uGlowPos.value.set(p[0], p[1], p[2]);
    const impactFlash = [TL.IMPACT, TL.PERIOD_LAND].reduce((a, fi) => a + (f >= fi ? 2 * Math.exp(-(f - fi) / 7) : 0), 0);
    glowU.uGlowI.value = heroGroup.visible ? (0.85 + impactFlash) * Math.min(1, vis) * (C.heroRadius(f) / R) ** 2 : 0;

    // floor uniforms
    const imp = fu.uImpacts.value;
    const setImp = (v: THREE.Vector4, fi: number, at: V3, s: number) =>
      f >= fi ? v.set(at[0], at[2], (f - fi) / F, s) : v.set(0, 0, 0, 0);
    setImp(imp[0], TL.IMPACT, [0, 0, 0], 1);
    setImp(imp[1], TL.BOUNCE2, [0, 0, 0], 0.32);
    setImp(imp[2], TL.PERIOD_LAND, C.P, 0.85);
    const glowFade = 1 - smoothstep(3.5, 6.5, p[1]); // high above the floor (drop-in / float-out) casts no pool
    fu.uSphere.value.set(p[0], Math.max(0.05, p[1] - r * (1 - sy) * pin), p[2], heroGroup.visible ? 0.42 * Math.min(1, vis) * (C.heroRadius(f) / R) * glowFade : 0);

    // MOTION letters
    motionMeshes.forEach((m, i) => {
      const y = C.letterY(i, f);
      const h = L.motion[i].g.box.max.y;
      m.visible = y > -h - 0.05 && f >= TL.LETTER_RISE[i];
      m.position.y = y;
      m.scale.y = C.letterSquash(i, f);
    });

    // panels
    panels.forEach((pn, i) => {
      const fin = TL.PANEL_IN[i];
      const fout = TL.PANEL_OUT + 6 * i;
      const sIn = spring((f - fin) / F, 1.5, 0.62);
      const antic = 0.25 * Math.sin(Math.PI * clamp((f - fout) / 10));
      const sOut = easeIn((f - fout - 4) / 26);
      const dz = pn.d.from * (1 - sIn) + (f > fout ? -Math.sign(pn.d.to) * antic + pn.d.to * sOut : 0);
      pn.g.position.set(pn.d.pos[0], pn.d.pos[1], pn.d.pos[2] + dz);
      pn.g.visible = f > fin - 2 && f < fout + 32;
      const prog = clamp((f - fin - 12) / 46);
      const e = easeInOut(prog);
      pn.tube.geometry.setDrawRange(0, Math.floor(e * SEG) * 8 * 6);
      pn.head.visible = e > 0.002;
      pn.head.position.copy(pn.curve.getPointAt(Math.max(0.001, e)));
    });

    // ring of words
    const ringOn = f >= TL.RING_IN && f < TL.RING_OUT + 30;
    ringGroup.visible = ringOn;
    if (ringOn) {
      const ang = C.ringAngle(f);
      ringItems.forEach((it, i) => {
        it.pivot.rotation.y = ang + it.beta;
        const sIn = spring((f - (TL.RING_IN + 6 + 0.7 * i)) / F, 2.2, 0.5);
        const o = f - (TL.RING_OUT + it.exitDelay);
        const sOut = o < 0 ? 1 : o < 5 ? 1 + 0.08 * Math.sin((Math.PI * o) / 5) : 1 - easeIn((o - 5) / 12);
        const s = Math.max(0, sIn * sOut);
        it.holder.scale.setScalar(s);
        it.holder.visible = s > 0.001;
      });
    }

    // title: particles snap in, glyphs solidify (orange heat cooling to cream), sink in reverse at the end
    const nT = titleMeshes.length;
    titleMat.emissiveIntensity = f >= TL.DROP ? 1.5 * Math.exp(-Math.max(0, f - TL.DROP - 8) / 9) * smoothstep(TL.DROP + 2, TL.DROP + 10, f) : 0;
    titleMeshes.forEach((m, i) => {
      const fa = TL.DROP + 9; // all glyphs solidify together as the beads land
      const zs = 0.08 + 0.92 * spring((f - fa) / F, 2.4, 0.55);
      const k2 = nT - 1 - i;
      const fs = TL.SINK_START + TL.SINK_STEP * k2;
      const top = L.title[i].pos[1] + L.title[i].g.box.max.y;
      const antic = 0.06 * Math.sin(Math.PI * clamp((f - fs) / 9));
      const sink = (top + 0.3) * easeInOut((f - fs - 6) / 40);
      m.position.y = L.title[i].pos[1] + (f > fs ? antic : 0) - (f > fs + 6 ? sink : 0);
      m.scale.z = Math.max(0.001, zs);
      m.visible = f >= fa && m.position.y + L.title[i].g.box.max.y > -0.02;
    });

    // beads get a shorter effective shutter (~60 deg) so the snap reads as crisp streaks, not straw
    particles.update(current + (f - current) * 0.35, streak * 0.35);

    // post
    const fp = C.focus(f);
    dof.target!.set(...fp);
    const [bs, fr] = C.bokeh(f);
    dof.bokehScale = bs;
    dof.cocMaterial.focusRange = fr;
    (grain.uniforms.get('seed') as THREE.Uniform).value = (f % 97) + 1;
  };

  const update = (f: number) => {
    current = f;
    apply(f, SHUTTER / (OFFSETS.length - 1));
  };
  const render = () => composer.render();

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
    scene.environment = null;
  };

  return {root, update, render, dispose};
};
