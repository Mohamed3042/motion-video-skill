// Where every section lives in the one shared 3D space (the "Orbit system"). Plain TS.
// The Orbit planet sits at the world origin. The ten feature worlds are stations on a rising helix around it:
// each station's LOCAL frame has +z pointing radially OUTWARD from the planet, so a camera at local +z looking
// toward local -z sees the station's content with the planet glowing far behind it.
import type {SectionId} from '../timing.ts';
import {rotY, type V3} from './math.ts';

export type Placement = {origin: V3; yaw: number};

export const PLANET_RADIUS = 900;
export const STATION_RADIUS = 9000;
const WORLD_ORDER = ['profile', 'globe', 'findings', 'focus', 'fit', 'nextproof', 'market', 'employers', 'engine', 'anywhere'] as const;

const station = (i: number): Placement => {
  const yaw = ((i * 36 - 18) * Math.PI) / 180; // 36° apart, starting just left of the story axis
  const y = (i - 4.5) * 420; // gentle helix: worlds climb as the film progresses
  return {origin: [STATION_RADIUS * Math.sin(yaw), y, STATION_RADIUS * Math.cos(yaw)], yaw};
};

export const PLACEMENT: Record<SectionId | 'finale', Placement> = {
  // The noise storm and the turn happen at the planet itself: the noise collapses into its orbit.
  chaos: {origin: [0, 0, 0], yaw: 0},
  turn: {origin: [0, 0, 0], yaw: 0},
  ...(Object.fromEntries(WORLD_ORDER.map((id, i) => [id, station(i)])) as Record<(typeof WORLD_ORDER)[number], Placement>),
  // The finale works in world coordinates (it pulls back to reveal the whole system).
  finale: {origin: [0, 0, 0], yaw: 0},
};

/** Local (section) coords → world coords. */
export const toWorld = (pl: Placement, p: V3): V3 => {
  const r = rotY(p, pl.yaw);
  return [r[0] + pl.origin[0], r[1] + pl.origin[1], r[2] + pl.origin[2]];
};
