// PLACEHOLDER camera for this world (local coords; +z points away from the planet). The world builder replaces it.
// Must return a sensible shot for f in [-24, length + 24] (the engine flies in/out across that margin).
import {oneToOne, type Shot} from '../../engine/math.ts';

const D = oneToOne(40);
export const shot = (f: number): Shot => ({pos: [Math.sin(f / 200) * 160, 60, D + 260 - f * 0.4], target: [0, 0, 0], fov: 40});
