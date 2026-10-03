// Station 8 · Employers — the café-wall façade (LOCAL coords, y up, façade plane z = 0 facing +z / the camera).
// Mortar line k (a floor ledge) sits at y = k·ROW. Row k (between ledges k and k+1) is a dark band with a light
// window every other TILE; odd rows are offset by half a tile — the classic wedge arrangement (as v1's kit).
export const TILE = 220;
export const ROW = 140;
export const MORTAR = 10;
export const K0 = -9; // ledges K0 … K1, rows K0 … K1-1
export const K1 = 10;
export const X0 = -4400;
export const X1 = 3600;
export const DARK = '#050a33';
export const LIGHT = '#ddd7ff';
export const MORTAR_C = '#8b8fb8';

export type Win = {k: number; i: number; x: number; y: number}; // x,y = window centre
export const windows = (): Win[] => {
  const out: Win[] = [];
  for (let k = K0; k < K1; k++) {
    const off = (Math.abs(k) % 2) * (TILE / 2);
    for (let i = Math.floor((X0 - off) / (2 * TILE)); off + i * 2 * TILE + TILE <= X1; i++) {
      const x = off + i * 2 * TILE;
      if (x < X0) continue;
      out.push({k, i, x: x + TILE / 2, y: k * ROW + ROW / 2});
    }
  }
  return out;
};
/** the window nearest to (x, y) on the façade */
export const nearestWindow = (x: number, y: number) => windows().reduce((b, w) => (Math.hypot(w.x - x, w.y - y) < Math.hypot(b.x - x, b.y - y) ? w : b));
