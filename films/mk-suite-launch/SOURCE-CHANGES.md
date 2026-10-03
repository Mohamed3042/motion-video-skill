# MK Suite launch recovery source changes

All work is contained in this recovery folder. The canonical studio was read for comparison only.

Preservation checks verified all **165 original manifest files** by SHA-256 and byte count, with **zero mismatches**. The manifest covers 100 public assets, 16 scripts and 49 source files. The separate `original-source.zip` contains 65 matching source/script entries plus `package.json` and `tsconfig.json`; both configuration files also match their canonical and recovery copies. The ZIP holds source and configuration. The 100 original public assets, including the old master, remain in the canonical project covered by the manifest.

Full file hashes, archive hash, cue counts and verification time are recorded in `evidence/source-audit.json`. This preservation proof covers the recorded files, not unrelated original compositions or shared dependency contents.

## Recovery changes

- Added `src/index.ts` and `src/RecoveryRoot.tsx` as an isolated entry and composition registry. It imports only MK Suite launch sources and registers `MkSuiteLaunch` (7,200 frames) and `MksAct` (1,464 frames), both at 1920×1080 and 60 fps. The original shared entry and Root were not edited.
- Completed `src/mks/acts/reveal/timing.ts`: 14 sound cues replace the empty `EVENTS` array. The two visible layout clicks are at local frames 540 and 660. Drop/slam impacts at 0 and 360 declare small shake values applied by the existing shell. The score detects the explicit drop and avoids adding another one.
- Updated reveal `Act.tsx` to share its existing frame constants with `timing.ts`. Substituting the constants produces the same visual source as the preserved original after line-ending normalization; no reveal camera path, title timing, layout or cursor movement changed.
- Updated Create `Library.tsx` to crop to the content pane during the search close-up and restore the sidebar during the existing pull-back after Enter (local frames 1,038–1,064). The library and command-search background use the same dynamic crop. This changes framing without changing the key presses, typed text, shots or interactions.
- Regenerated `public/mks/music.wav` in recovery from the current 161 events. Existing logs report −14 LUFS, −1.4 dBTP, 120.000000 seconds, and all 67 listed impact/hit/key/click onset checks passing within ±1 frame. These statements come from the saved logs; this source audit did not run audio generation or checks.
- Added `scripts/mks/verify-delivery.mjs` as a delivery validation helper after the film render started. It is not imported by the film and does not change its source.

Of the 165 copied manifest files, **161 remain byte-identical** and **4 changed**: reveal `timing.ts`, reveal `Act.tsx`, Create `Library.tsx`, and the recovery `music.wav`. `package.json` and `tsconfig.json` were additionally copied unchanged. The three new studio files are the isolated entry, registry, and delivery verifier.

## Dependencies and static verification

`studio/node_modules` is a junction to the existing canonical `studio/node_modules`. It reuses installed dependencies and was excluded from copying, archive and hash proof; no dependency installation is part of this recovery.

Static checks passed: seven unique acts cover frames 0–7,199 with no gaps or overlaps; every event array is sorted and within its own act; there are 161 cues total; reveal click and shake frames match the intended visual cues. The final rendered video was still in progress when this source audit was prepared. Source checks and audio logs do not substitute for final visual and listening review.
