// Single source of truth for timing. Plain TS (erasable syntax only) so that both the
// Remotion scene (webpack) and the Node music script (`node scripts/opus/music.ts`) import it.
// All values are in frames at 60 fps; 120 BPM => one beat every 30 frames, one 4/4 bar = 120 frames.

export const FPS = 60;
export const DURATION = 1500; // 25.0 s
export const BPM = 120;
export const BEAT = 30;
export const BAR = 120;

// 0:00-0:02 THE DROP
export const IMPACT = 30; // sphere hits the floor (0.5 s): deep bass hit + bell ping + floor ring
export const BOUNCE2 = 60; // the one smaller bounce lands (1.0 s) = first note of the hook
export const SETTLE = 72; // tiny settle tap
export const ROLL_START = 84;
export const HOP = 150; // sphere hops off the floor toward the first letter

// 0:02-0:06 MOTION
export const LETTER_RISE = [120, 150, 180, 210, 240, 270]; // one letter per beat
export const LETTER_LAND = [180, 210, 240, 270, 300, 330]; // one bounce per beat, each on a hook note
export const LAUNCH = 330; // the bounce on "N" launches the sphere
export const APEX = 378; // sphere hangs weightless at the top of its arc
export const MOTION_SINK = 384; // MOTION letters slip back into the floor while the camera tilts up

// 0:06-0:10 MORPH
export const PANEL_IN = [396, 420, 444];
export const MORPH = [420, 450, 480, 510, 540]; // start, rounded cube, torus, pill, sphere (one shape per beat)
export const PANEL_OUT = 578; // panels clear out just before the ring forms

// 0:10-0:14 ORBIT
export const RING_IN = 600;
export const RING_OUT = 885; // back of the ring pops away first, the letters at the gap last

// 0:14-0:18 FLOW (build)
export const SPLIT = 900; // sphere bursts into particles
export const FREEZE = 1050; // 17.5 s: everything freezes, music is silent
export const DROP = 1080; // 18.0 s: particles snap into the title, impact + brass stab

// 0:18-0:22 REVEAL
export const REFORM = 1090; // sphere re-forms from particles
export const PERIOD_LAND = 1140; // 19.0 s: sphere lands as the period

// 0:22-0:25 LOOP
export const SPHERE_RISE = 1326;
export const SINK_START = 1332;
export const SINK_STEP = 3; // frames between letters sinking (reverse order)
export const OUTRO = 1320; // 22.0 s: groove drops out, only the plucked hook remains
export const END_BELL = 1440; // 24.0 s: final bell, same as the opening ping

// The hook: a five-note plucked phrase. Note offsets (frames) relative to a phrase start.
export const HOOK_RHYTHM = [0, 30, 45, 60, 90];
// Phrase starts. Every 2 s on beat 3 (1.0 s, 3.0 s, ...) until the build, then re-phrased on the drop downbeat.
export const HOOK_STARTS = [60, 180, 300, 420, 540, 660, 780, 900, 1080, 1200, 1320];

export const hookNoteFrames = (): number[] =>
  HOOK_STARTS.flatMap((s) => HOOK_RHYTHM.map((o) => s + o));

export const SILENCE_START = DROP - 30; // 17.5 s
export const SILENCE_END = DROP; // 18.0 s
