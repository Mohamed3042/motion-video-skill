// Station 7 · My market — the data city's geometry (LOCAL coords, y up, +z toward the camera / away from the planet).
// Avenues run along x on the ground (y = 0) at z = k·S. Seen from straight above (camera rolled 45°) they are the
// Zöllner field; at street level the six middle bands are the capability rows of the country × capability matrix.
export const S = 160; // avenue spacing
export const KMAX = 16; // avenues k = -KMAX … KMAX
export const XL = 3000; // avenue half-length
export const LW = 13; // avenue line width
export const HS = 66; // hatch spacing along an avenue
export const HL = 62; // hatch half-length
export const HW = 8; // hatch width
export const PAIR = [-1, 0]; // the two avenues that light coral

// matrix: rows r = 0 (far, AI automation) … 5 (near, SQL) sit in the bands between avenues -3 … 3
export const rowZ = (r: number) => (r - 2.5) * S;
export const COLX = [-270, 0, 270];
export const CW = 150; // column width (x)
export const CD = 92; // column depth (z)
export const HMAX = 380;
export const COUNTRIES = [
  {code: 'EG', name: 'Egypt'},
  {code: 'KW', name: 'Kuwait'},
  {code: 'SA', name: 'Saudi Arabia'},
];
// v1 sample data (claim-reviewed). null = no evidence in the saved research → shown as UNKNOWN.
export const CAPS: {name: string; v: (number | null)[]}[] = [
  {name: 'AI automation', v: [0.92, 0.38, 0.62]},
  {name: 'Python', v: [0.74, 0.52, 0.8]},
  {name: 'Data pipelines', v: [0.46, null, 0.56]},
  {name: 'Cloud platforms', v: [0.62, 0.3, 0.72]},
  {name: 'Docker containers', v: [0.55, 0.22, null]},
  {name: 'SQL & analytics', v: [0.4, 0.48, 0.34]},
];
// "What changed" tick 1 ("Data pipelines — newly observed in Kuwait") fills this cell from UNKNOWN.
export const NEW_CELL = {r: 2, c: 1, v: 0.18};
