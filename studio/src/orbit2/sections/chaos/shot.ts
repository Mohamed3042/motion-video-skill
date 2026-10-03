// Act 1 camera: the continuous story camera (sections/chaos/story.ts); local = world here (chaos sits at the planet).
import type {Shot} from '../../engine/math.ts';
import {storyCam} from './story.ts';

export const shot = (f: number): Shot => storyCam(f);
