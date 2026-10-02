// Finale (77–90 s) event frames. Global frames. Plain TS: imported by picture AND sound.
import {FINALE, LOGO_LOCK, WORLDS} from '../timing.ts';

export const MONTAGE = FINALE.start; // 4620: one hero frame per beat (30 f) for the nine worlds
export const MBEAT = 30;
export const MONTAGE_BEATS = WORLDS.map((_, k) => MONTAGE + k * MBEAT); // 4620 … 4860
export const CONVERGE = MONTAGE + WORLDS.length * MBEAT; // 4890: the nine rings converge
export {LOGO_LOCK}; // 4920: rings collapse into the mark (boom)
export const RISE = [LOGO_LOCK + 30, LOGO_LOCK + 66] as const; // mark rises to make room for the card
export const CARD = 4980; // 83 s: end-card lines, one per beat
export const LINES = [CARD, CARD + 24, CARD + 48, CARD + 78, CARD + 108] as const;
export const FADE = 5310; // 88.5 s: fade to black
