// Act 2 camera: the same continuous story camera as Act 1 (no hop at the ignite: the shot simply continues).
import type {Shot} from '../../engine/math.ts';
import type {FlightIn} from '../../engine/camera.ts';
import {storyCam, T0} from '../chaos/story.ts';

export const FLIGHT_IN: FlightIn = {len: 0};
export const shot = (f: number): Shot => storyCam(f + T0);
