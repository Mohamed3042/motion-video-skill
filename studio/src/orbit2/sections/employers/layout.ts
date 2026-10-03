// Station 8 · Employers — where the two dossier holograms rest (pixel-exact at the hero pose) and which façade
// window each one swings out of (the window behind it along the camera ray). Shared by World (CSS) and GL.
import {anchor, faceShot} from '../market/holo';
import {nearestWindow} from './geom';
import {HERO_SHOT} from './shot';

export const CARD = {w: 800, h: 560};
const at = (sx: number, sy: number) => {
  const rest = anchor(HERO_SHOT, sx, sy);
  const c = HERO_SHOT.pos;
  const t = c[2] / (c[2] - rest[2]);
  const win = nearestWindow(c[0] + (rest[0] - c[0]) * t, c[1] + (rest[1] - c[1]) * t);
  return {rest, win};
};
export const DOSSIERS = [
  {name: 'Northstar Labs', monogram: 'N', context: 'Workflow automation', detail: 'Python mentioned in a public post', source: 'Employer engineering page', ...at(110 + CARD.w / 2, 214 + CARD.h / 2)},
  {name: 'Cedar Systems', monogram: 'C', context: 'Reporting systems', detail: 'Operations needs in a public post', source: 'Employer news feed', ...at(1010 + CARD.w / 2, 214 + CARD.h / 2)},
];
export const FACE = faceShot(HERO_SHOT);
