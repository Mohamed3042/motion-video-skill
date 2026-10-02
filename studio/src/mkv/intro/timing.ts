// Intro (0–6 s) event frames. Global frames (the intro starts at 0). Plain TS: imported by picture AND sound.
export const IGNITE = 30; // sub impact, the green line ignites edge to edge
export const WAVE = [36, 96] as const; // the line vibrates into a waveform
export const SPLIT = [90, 128] as const; // the waveform splits into nine strands
export const CURL = [118, 176] as const; // strands curl into nine concentric rings
export const TITLE = 180; // "MK Voice" slams in (title hit)
export const TAGLINE = 270; // "One voice. Nine worlds."
export const DIVE = 336; // camera dives into the amber ring (5.6 s)
export const RISER = [60, 348] as const; // Shepard riser 1.0 → 5.8 s

// Ring i (0 = My Voice … 8 = Guide). Amber is innermost: the dive goes through it.
export const ringRadius = (i: number) => 70 + i * 54;
// Camera zoom of the ring tunnel during the dive (1 → 18 between DIVE and the end of the portal).
export const diveZoom = (g: number) => {
  const u = Math.min(1, Math.max(0, (g - DIVE) / 30));
  return 18 ** (u * u);
};
