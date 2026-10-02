// PLACEHOLDER camera (local = world here: the story acts happen at the planet). The framework builder replaces it.
import type {Shot} from '../../engine/math.ts';

export const shot = (f: number): Shot => ({pos: [0, 400, 5200 - f * 0.8], target: [0, 0, 0], fov: 40});
