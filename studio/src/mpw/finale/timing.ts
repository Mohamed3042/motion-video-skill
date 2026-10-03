// Finale (150–164 s). Global frames. Plain TS: shared by the picture AND the sound.
import {FINALE, LOGO_LOCK, WORLDS} from '../timing.ts';

export const MONTAGE = FINALE.start; // 9000: 4×3 multicam grid, the active angle cuts on every beat
export const MBEAT = 30;
export const MONTAGE_BEATS = WORLDS.map((_, k) => MONTAGE + k * MBEAT); // 9000 … 9300 (11 beats)
// Active angle per beat (tile index; tile 0 = intro, tile N = world N). Every world gets one cut; it starts on
// Anywhere because the edit into the finale pulls that picture back into its tile.
export const ACTIVE_TILE = [11, 2, 6, 9, 1, 7, 3, 10, 5, 8, 4];
export const SLIDE = 9330; // 155.5 s: tiles fold into clip bars, out of sync
export const SNAPS = [9360, 9390, 9420] as const; // the clips slide into sync, one group per beat
export const COLLAPSE = [9420, 9462] as const; // synced clips collapse into the playhead line
export {LOGO_LOCK}; // 9480: In/Out brackets snap open → MONTAGE PRO (impact + shockwave)
export const RISE = [9516, 9552] as const; // wordmark rises to make room for the card
export const LINES = [9540, 9570, 9600, 9630] as const; // end-card lines, one per beat
export const FADE = 9780; // 163 s: fade to charcoal

// 4×3 multicam grid (tile 0 = intro, tile N = world N), inside the HUD-free band.
export const TILE_W = 420;
export const TILE_H = (TILE_W * 9) / 16;
export const TILE_GAP = 16;
const GX = (1920 - (4 * TILE_W + 3 * TILE_GAP)) / 2;
const GY = (1080 - (3 * TILE_H + 2 * TILE_GAP)) / 2;
export const tileRect = (i: number) => ({x: GX + (i % 4) * (TILE_W + TILE_GAP), y: GY + Math.floor(i / 4) * (TILE_H + TILE_GAP), w: TILE_W, h: TILE_H});
