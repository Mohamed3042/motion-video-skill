import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx, geometry.ts AND scripts/mkv/worlds/clonelab.ts.
// The orb hops up one tread per 8th note and rests a beat on each corner landing; each flight's label lights
// as the orb lands on its first tread.
export const SETUP = 120; // bar 2 downbeat
export const REC = 240; // bar 3 downbeat
export const CAL = 360; // bar 4 downbeat
export const TRAIN = 420; // beat 3 of bar 4 — the door at the top glows
export const READY_EN = CAL + 30; // English normal range reaches "ready"
export const READY_AR = CAL + 45; // العربية reaches "ready"
export const DOOR = 450; // the orb reaches the top landing, at the door
export const SPIN = 452; // exit: the staircase spins into a ring of segments …
export const SETTLE = 478; // … that is static from here (Live's drift ring starts static)

// treads per flight (SET UP, RECORD, CALIBRATE, TRAIN), each followed by a landing
export const FLIGHT_TREADS = [6, 6, 2, 2];
export const LOOP = 360;
// landing frame of every cell in one loop, relative to the first SET UP tread (treads 15 f apart, landings 30 f)
export const CELL_T: number[] = [];
{
  let t = 0;
  for (const n of FLIGHT_TREADS) {
    for (let i = 0; i < n; i++) {
      CELL_T.push(t);
      t += 15;
    }
    CELL_T.push(t); // landing
    t += 30;
  }
}
export const ORB_F0 = SETUP; // first SET UP tread lands on bar 2's downbeat
// every orb landing frame from just before the world to just after it (sound: one glass note per hop)
export const HOPS: {f: number; cell: number}[] = [];
for (let loop = -1; loop <= 1; loop++)
  CELL_T.forEach((t, r) => {
    const f = ORB_F0 + loop * LOOP + t;
    if (f >= -12 && f < 492) HOPS.push({f, cell: loop * CELL_T.length + r});
  });

export const EVENTS: WorldEvent[] = [
  {f: SETUP, kind: 'tick'},
  {f: REC, kind: 'tick'},
  {f: CAL, kind: 'tick'},
  {f: READY_EN, kind: 'blip'},
  {f: READY_AR, kind: 'blip'},
  {f: TRAIN, kind: 'impact', shake: 7},
  {f: SPIN, kind: 'whoosh'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 300;
