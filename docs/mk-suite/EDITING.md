# MK Suite: the editable film

This folder documents the 90-second, 23-product film. V2 shows illustrated product workflows with an input, a visible action and an outcome. V1 preserves the earlier abstract world treatment for comparison. Every visible object and sound is code. No proprietary application install or private workspace is required to build the film.

## Start here

Use Node.js 22.18+ (Node 24 recommended), npm, FFmpeg and ffprobe. Packaging also requires Git and a repository with an existing commit. On a fresh clone:

```sh
npm run setup
npm run music
npm run check
npm run dev
```

The browser preview exposes `MkSuiteWorkflows` (the whole film) and `MkSuiteWorkflowsSeg` (a single product). The debug composition takes an `id` prop such as `voice` or `quotes`. Scene frame zero is composition frame 12 in this debug view because transitions have a 12-frame overlap.

The first Remotion run downloads its browser. Fonts are loaded by `@remotion/google-fonts`; internet is needed for the first render and any uncached font loads. The exact npm dependency versions are recorded in `studio/package-lock.json`.

## Find what to change

| Edit | File or directory |
| --- | --- |
| Product visuals, interactions, sample data and labels | `studio/src/mk-suite-workflows/segments/<id>/World.tsx` |
| A product's impact frames | `studio/src/mk-suite-workflows/segments/<id>/timing.ts` |
| When the pointer leaves after its last click | `cursorOut(f, frame)` in the scene's `World.tsx`; the helper is `studio/src/mk-suite-workflows/shell/cursor.ts` |
| A product's synthesized audio | `studio/scripts/mk-suite-workflows/segments/<id>.ts` |
| Film length, frame ranges, beats and segment IDs | `studio/src/mk-suite-workflows/timing.ts` |
| Product order, written intent, claim limits | `briefs/mk-suite-workflows.plan.json` and `briefs/mk-suite-workflows.md` |
| Fonts, brand and per-product colours | `studio/src/mk-suite-workflows/brand.ts` |
| Intro and subscription end card | `studio/src/mk-suite-workflows/intro/` and `outro/` |
| Scene transitions, HUD and soundtrack playback | `studio/src/mk-suite-workflows/Reel.tsx` |
| Score, level matching and audio mastering | `studio/scripts/mk-suite-workflows/music.ts` and `dsp.ts` |
| Scene registry and composition registration | `studio/src/mk-suite-workflows/segments/index.ts`, `Root.tsx`, `entry.ts` |
| Review stills, export checks and command-line tooling | `tools/mk-suite/` |
| V1's corresponding files | Replace `mk-suite-workflows` with `mk-suite-worlds` |

## Recommended AI edit cycle

1. Read this guide, the scene's `World.tsx`, its timing file, and the relevant brief. Make one visual change at a time. Keep sample data labelled DEMO and preserve truthful capability limits.
2. Preview the edited scene: `node tools/mk-suite/film.mjs review worlds voice` (replace `voice`). Inspect both the input and result PNGs at full resolution.
3. Run `npm run check`. If timing or sound changed, first run `npm run music`; picture and sound must use the same event frames.
4. For a full revision, run `npm run stills`, `npm run transitions`, and `node tools/mk-suite/film.mjs review framework`. Inspect the images. These commands write files under `outputs/mk-suite-workflows/review/`.
5. Follow the export and delivery commands below. Inspect the frames extracted from the finished master before generating the report.
6. Repeat the export checks after changing the film or audio. Regenerate the report and source archive after their inputs change. A technical audio check is not a listening review.

All commands work from the project root. `npm run render` uses the standalone V2 entry point and six concurrent rendering workers. In the full GitHub clone, the upstream templates remain available through the original studio entry point. The film source ZIP contains only the complete MK Suite V1/V2 projects: use their standalone entries; upstream template and orchestrator instructions in the repository README do not apply to that archive.

## Export, check and package

After reviewing the stills and running `npm run check`, create both video files and check the finished master:

```sh
npm run render
npm run share
npm run verify
```

The master is `outputs/mk-suite-workflows.mp4`; the share copy is `outputs/mk-suite-workflows/MK-Suite-Workflows-Share.mp4`. Verification decodes the master, counts its frames, measures its AAC audio and extracts 25 review frames. Read `outputs/mk-suite-workflows/review/exported/exported-qc.json` and inspect the `exported-sheet-*.jpg` images in the same folder. Resolve failed checks and review notes before proceeding.

Decode and measure the share copy separately. This PowerShell command writes the UTF-8 log consumed by the report generator, and stops on a failed decode:

```powershell
$shareDecodeLog = & ffmpeg -hide_banner -nostdin -nostats -loglevel repeat+level+info -xerror -err_detect explode -i "outputs/mk-suite-workflows/MK-Suite-Workflows-Share.mp4" -map 0:v:0 -map 0:a:0 -af "ebur128=peak=true" -f null - 2>&1
$shareDecodeExit = $LASTEXITCODE
$shareDecodeLog | ForEach-Object { "$_" } | Set-Content -LiteralPath "outputs/mk-suite-workflows/share-decode.log" -Encoding utf8
if ($shareDecodeExit -ne 0) { throw "Share decode failed with exit code $shareDecodeExit. Inspect share-decode.log." }
```

Then build the gallery and captions, generate the production report and hashes, and package the editable source:

```sh
npm run delivery
npm run report
npm run package:check
npm run package
npm run delivery
```

`delivery` writes `index.html`, `chapters.json`, `MK-Suite.srt` and `MK-Suite.vtt` under `outputs/mk-suite-workflows/`. It checks local gallery links and validates the master when present. The first run may list the source ZIP and report as missing; the final run should list no missing delivery assets.

`report` requires a passed master QC record, both MP4s and the completed `share-decode.log`. It checks share metadata and loudness before writing `production-report.md` and `delivery-manifest.json`, plus the repository copies `docs/mk-suite/PRODUCTION.md` and `VALIDATION.json`. Its prose records the review performed for this revision: keep the visual-review counts, fixes and listening status accurate when revising the film. Running the generator does not perform a human visual or listening review.

`package:check` checks the allowed source files, imports, dependency lockfile, both soundtracks and publication hygiene without creating an archive. `package` writes `outputs/mk-suite-workflows/MK-Suite-Workflows-Source.zip` and `docs/mk-suite/package-audit.json`, then verifies every archived file against the source. It uses an isolated Git index and preserves the working branch and real index. Run it last so the archive includes the current guide, report and validation records.

Repackaging requires Git and a checkout with an initial commit. Rendering and editing an extracted source ZIP work without Git. Use a repository clone if you want to run the archive builder unchanged.

Open `outputs/mk-suite-workflows/index.html` to check the player, chapter selection, playback speeds and scene looping. If the browser restricts subtitles on a local file URL, serve the repository with a local HTTP server and open the gallery through that server.

## Timing contract

The film contains exactly 5,400 video frames at 60 fps. Intro: frames 0–191. Products: frames 192–5279. Outro: frames 5280–5399. Musical grid: 150 BPM, 24 frames per beat. Local frame 60 is the first product action/impact; local frame 120 is an optional second action. Results should be visible by frame 96 or 120 and held long enough to read.

The single source of truth for rendering and synthesis is `timing.ts`. The written plan must agree with it. If changing duration or order, also update the fixed 90-second/23-world expectations in the review, share, delivery and verification scripts. Do not silently stretch the movie or the audio.

Use `useSegFrame()` for scene time and existing easing helpers for motion. Do not use browser clocks, randomness, live network data or real customer information in a scene. All motion must be deterministic. SVG paths that are lines need `fill="none"`. Keep critical content within x=72–1848 and y=82–1006 at 1920×1080. Show readable controls and resulting state changes, not only decorative movement.

## Product truth and presentation

These are illustrative workflows based on product documentation, not recordings of live applications. Prices, sample quantities, fixture files and labels inside the demos explain interactions; they are not product performance claims. Keep consent, review, approval and preview states visible where the product requires them. Do not turn draft campaigns into sent messages, reviewed cleaning plans into completed deletion, extracted repository context into unsupported AI answers, or game showcases into invented gameplay.

The approved closing line is **One suite. One monthly subscription.** It has no price. Preserve **Subscription concept; product availability varies. Free cores remain free.** The film does not claim connected billing or universal availability.

## Source and delivery boundaries

The repository includes the complete visual and sound code, assets needed by the film, dependencies, briefs, reusable scripts and documentation. Generated final videos and source ZIPs are also attached to the film's GitHub release. Caches, installed `node_modules`, temporary render frames, private product source trees, credentials and orchestrator session records are not project inputs and are excluded from the publication.

Use the existing MIT license for the upstream code and review Remotion's own licensing requirements for your intended use. The score uses code-generated oscillators, with no borrowed audio samples.
