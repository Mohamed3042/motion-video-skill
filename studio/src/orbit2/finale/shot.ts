// PLACEHOLDER finale camera (world coords): pull back to reveal the whole Orbit system. The framework builder replaces it.
import type {Shot} from '../engine/math.ts';
import type {FlightIn} from '../engine/camera.ts';

export const FLIGHT_IN: FlightIn = {len: 60, arc: 0.25, fovPunch: 10};
export const shot = (f: number): Shot => ({pos: [0, 9000 + f * 4, 26000 + f * 6], target: [0, 0, 0], fov: 40});
