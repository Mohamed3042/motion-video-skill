// Finale (102–120 s) event frames. Global frames. Plain TS: imported by picture AND sound.
import {FINALE, LOGO_LOCK, WORLDS} from '../timing.ts';

export const MONTAGE = FINALE.start; // 6120: one hero frame per beat (30 f) for the ten worlds
export const MBEAT = 30;
export const MONTAGE_BEATS = WORLDS.map((_, k) => MONTAGE + k * MBEAT); // 6120 … 6390
export const CONVERGE = MONTAGE + WORLDS.length * MBEAT; // 6420: the ten rings converge into the planet
export {LOGO_LOCK}; // 6480: the real logo locks (boom, shockwave, coral glint)
export const RISE = [LOGO_LOCK + 40, LOGO_LOCK + 90] as const; // logo rises to make room for the card
export const CARD = LOGO_LOCK + 90; // 6570: end-card lines, on beats
export const LINES = [CARD, CARD + 30, CARD + 60, CARD + 120] as const; // title, tagline, chip, small print
export const GLINT2 = CARD + 240; // a second, softer glint on the satellite while the card holds
export const FADE = 7080; // 118 s: fade to navy (done by the Reel)
