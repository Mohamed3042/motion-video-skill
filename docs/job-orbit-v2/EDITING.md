# Editing Job Orbit v2 — The Flight

This standalone film is **120 seconds, 1920 × 1080, 60 fps and 7,200 frames**. Use `studio/src/orbit2/entry.tsx`, composition `JobOrbit2`. V1 remains separately preserved under `studio/src/orbit/` and its original release.

The interfaces are illustrated animation with fictional sample data, not runtime recordings. Preserve the sample labels and limits in [the product truth notes](../job-orbit/PRODUCT-TRUTH.md) and [the v2 brief](../../briefs/job-orbit-v2.md).

## Setup

Use Node.js 24 or Node.js 22.18+, and put `ffmpeg` and `ffprobe` on PATH. The locked packages include React, Remotion, three.js and the three.js React integrations. Initial preview/rendering downloads Chromium and Google Fonts. Font declarations live in `src/orbit2/brand.ts`; the complete entry uses only the v2 source tree and the supplied `public/orbit2` assets.

From the repository or extracted editable ZIP:

```sh
cd studio
npm ci
npx tsc --noEmit
npx remotion studio src/orbit2/entry.tsx
```

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if the script wrappers are blocked by execution policy. The repository-root npm commands belong to the separately preserved MK Suite film; use the explicit v2 commands here.

## Sound and export

The editable release includes the actual validated `public/orbit2/music.wav` and `../out/audio/orbit2/master-report.json`. The source WAV is 44.1 kHz, 16-bit stereo. Verify it directly with:

```sh
node scripts/orbit2/check.ts --self-test
```

After any picture timing or soundtrack edit, regenerate and check the score before rendering:

```sh
node scripts/orbit2/music.ts
node scripts/orbit2/check.ts --self-test
npx tsc --noEmit
npx remotion render src/orbit2/entry.tsx JobOrbit2 ../exports/job-orbit-v2-raw.mp4 --concurrency=4
node scripts/orbit2/finalize.ts ../exports/job-orbit-v2-raw.mp4 ../exports/job-orbit-v2.mp4
node scripts/orbit2/check.ts ../exports/job-orbit-v2.mp4 --self-test
node scripts/orbit2/verify-export.mjs ../exports/job-orbit-v2.mp4 --contacts
```

Choose new export filenames when revising. The finalizer protects existing outputs, preserves the raw picture and copies video packets while muxing a separately encoded 48 kHz stereo AAC track. This avoids the peak overshoot measured in Remotion's ordinary audio encode. Keep the H.264, `yuv420p` and BT.709 settings in `remotion.config.ts`.

## Review without changing the source

```sh
node scripts/orbit2/resume.mjs review ../review-v2
node scripts/orbit2/resume.mjs render ../review-v2
```

The helper creates a new output folder, renders 151 integrated source frames and records their source/asset fingerprint. Inspect the images before using its render mode. Render mode requires that fingerprint to remain unchanged and produces a muted raw movie for `finalize.ts`.

`stills.ts` can render selected global frames through the full-film camera. `Orbit2Section` and `Orbit2EngineTest` are debug compositions. Optional `review-sheets.py` makes diagnostic contact sheets using Python with Pillow and the Windows Consolas font; individual JPEGs and the ffmpeg contact-sheet helper are available without Python.

## Source structure

- `src/orbit2/engine/`: shared deterministic CSS 3D/WebGL camera and placement.
- `src/orbit2/sections/<id>/`: each station's picture, camera shot and local timing.
- `src/orbit2/shell/`: the continuous environment, planet and HUD.
- `src/orbit2/finale/`: system reveal and end card.
- `scripts/orbit2/`: score generation, audio checks and export helpers.
- `public/orbit2/`: logo, grain, real EG/KW/SA outlines and the synthesized score.

Retained `World2D.tsx` and legacy helpers preserve the prior copy/design reference. Active v2 worlds use real 3D sets and their own camera shots. Keep motion frame-derived and seeded; never introduce wall-clock animation into scenes.
