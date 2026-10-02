// Font outlines (opentype.js) -> bevelled, smooth-shaded THREE geometry, one mesh per glyph.
import * as THREE from 'three';
import type {Font, Glyph} from 'opentype.js';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Style = {size: number; depth: number; bevel: number};
export type PlacedGlyph = {
  index: number; // order among the visible glyphs of the line
  x: number; // pen position (line-local, before centering)
  geom: THREE.BufferGeometry;
  box: THREE.Box3;
  shapes: THREE.Shape[];
  front: number; // z of the front face
};

const cache = new Map<string, {geom: THREE.BufferGeometry; box: THREE.Box3; shapes: THREE.Shape[]}>();

const glyphShapes = (glyph: Glyph, size: number) => {
  const sp = new THREE.ShapePath();
  for (const c of glyph.getPath(0, 0, size).commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y);
    else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  // TrueType outer contours are clockwise in y-up space -> solids when isCCW = false
  return sp.toShapes(false);
};

const buildGlyph = (glyph: Glyph, st: Style) => {
  const key = `${glyph.index}|${st.size}|${st.depth}|${st.bevel}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const shapes = glyphShapes(glyph, st.size);
  const ex = new THREE.ExtrudeGeometry(shapes, {
    depth: st.depth,
    bevelEnabled: true,
    bevelThickness: st.bevel,
    bevelSize: st.bevel,
    bevelOffset: -st.bevel * 0.9,
    bevelSegments: 6,
    curveSegments: 9,
  });
  ex.translate(0, 0, -st.depth / 2);
  ex.deleteAttribute('uv');
  const geom = toCreasedNormals(ex, 0.75);
  ex.dispose();
  geom.computeBoundingBox();
  const out = {geom, box: geom.boundingBox!.clone(), shapes};
  cache.set(key, out);
  return out;
};

export const layoutText = (font: Font, text: string, st: Style) => {
  const glyphs: PlacedGlyph[] = [];
  let index = 0;
  const width = font.forEachGlyph(text, 0, 0, st.size, {kerning: true}, (g, x) => {
    if (!g.getPath(0, 0, st.size).commands.length) return; // spaces
    const b = buildGlyph(g, st);
    glyphs.push({index: index++, x, ...b, front: st.depth / 2 + st.bevel});
  });
  return {glyphs, width};
};

// Area-weighted random points on a glyph's front face (glyph-local coordinates).
export const sampleFace = (g: PlacedGlyph, count: number, rnd: () => number): THREE.Vector3[] => {
  const tris: [THREE.Vector2, THREE.Vector2, THREE.Vector2][] = [];
  for (const sh of g.shapes) {
    const {shape, holes} = sh.extractPoints(6);
    const verts = shape.concat(...holes);
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(shape, holes)) tris.push([verts[a], verts[b], verts[c]]);
  }
  const areas = tris.map(([a, b, c]) => Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2);
  const total = areas.reduce((p, v) => p + v, 0);
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    let r = rnd() * total;
    let k = 0;
    while (k < areas.length - 1 && r > areas[k]) r -= areas[k++];
    const [a, b, c] = tris[k];
    let u = rnd();
    let v = rnd();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    out.push(new THREE.Vector3(a.x + (b.x - a.x) * u + (c.x - a.x) * v, a.y + (b.y - a.y) * u + (c.y - a.y) * v, g.front));
  }
  return out;
};

export const glyphArea = (g: PlacedGlyph) =>
  g.shapes.reduce((acc, sh) => acc + Math.abs(THREE.ShapeUtils.area(sh.getPoints(6))) - sh.holes.reduce((h, p) => h + Math.abs(THREE.ShapeUtils.area(p.getPoints(6))), 0), 0);
