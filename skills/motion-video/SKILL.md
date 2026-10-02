---
name: motion-video
description: Make a finished motion-graphics video (brand reel, product promo, launch video, feature tour, logo reveal, kinetic type, 3D showreel, social clip) entirely in code with Remotion, with music synthesized in code, rendered to MP4. Use whenever the user asks to make, animate or render a video, reel, promo, intro, ad or motion graphics, or pastes a long video prompt.
---

# Motion video

You make videos where **every frame and every sound is code**. Remotion (React) draws the picture, a Node script synthesizes the music, and both read one timing file so every hit lands on its frame. The output is an H.264/AAC MP4.

## 0. Where things are

This skill ships in a repo laid out like this (paths below are relative to the repo root):
- `studio/` — the Remotion 4 project (React 18, TypeScript). Templates live in `studio/src/<slug>/`, their music and check scripts in `studio/scripts/<slug>/`.
- `briefs/` — one brief per video (the plan, written before any code).
- `outputs/` — finished renders.

If you were installed somewhere else (e.g. a global skills folder), find the repo first: ask the user for its path, or clone `https://github.com/Mohamed3042/motion-video-skill`.

**First-time setup** (once): Node.js 22+ and ffmpeg/ffprobe on PATH, then `cd studio && npm install`. Remotion downloads its own headless Chrome on the first render. Optional: `npx skills add remotion-dev/skills` inside `studio/` installs Remotion's official agent skills; read `remotion-best-practices` if you have it.

**Windows:** keep the repo at a short path (e.g. `C:\Users\<you>\Documents\motion-video-skill`). Very deep folders break git and Remotion with "Filename too long" / "$GIT_DIR too big".

## 1. Get the inputs (one question round, then go)

**Always ask for the length in seconds unless the user already gave it** — the user decides it every time. In the same round, ask only for what is missing (use your question tool if you have one, otherwise ask in plain text and wait):
- **Length** (required): suggest 10 / 20 / 30 / 60 / 90 s, accept any number.
- **Format:** 16:9 1920×1080 (default) · 9:16 1080×1920 (Reels/TikTok/Shorts) · 1:1 1080×1080.
- **Subject and brand:** product, website URL or logo file, colors. If the user's product has docs/README/design notes, read them — they are the source of truth for features.
- **Style:** flat 2D product/UI promo (like `mk`) · feature tour where every feature is its own world (like `mkv`) · glossy 3D (like `opus`).

If the user pasted a full prompt (scenes, music, timings), that IS the brief: save it verbatim and only ask for what it lacks. Use 60 fps unless told otherwise. `durationInFrames = seconds × fps`.

## 2. Write the brief: `briefs/<slug>.md`

Expand the idea into a brief at the quality of `briefs/mk-voice-worlds.md`: brand (palette in hex, fonts, logo/motif) · truthfulness rules · smoothness rules · global layers (HUD, grain, vignette) · numbered scenes with exact second ranges · music structure synced to those scenes listing every impact · motion rules.

Scale scenes to length: about one scene per 2–3 s (≥3 scenes for ≤10 s), or one *world* per 6–9 s for feature tours. Opening hook within the first second; end card in the last 2–3 s. Every cut is a designed 8–14 frame transition (zoom-through, whip-pan with blur, iris wipe, light flash, shape portal, or a continuous camera move for 3D).

**Be truthful about real products:** only features the user or the product's own docs state; no invented stats, prices, testimonials, user counts or "available now"; sample UI content is clearly placeholder; never real people's names, faces or voices.

## 3. Start from the closest template (copy patterns, don't reinvent)

| Style | Copy from |
|---|---|
| Product / UI promo; several reels sharing one design system | `studio/src/mk/` (`kit.tsx`, `engine.tsx`, `endcard.tsx`, `*.timing.ts`) + `studio/scripts/mk/` |
| Feature tour, "every feature is a whole world" (45 s+) | `studio/src/mkv/` + `studio/scripts/mkv/` — see §8 |
| Glossy 3D: glass, mirror floor, extruded type, morphs, particles→text, one continuous camera | `studio/src/opus/` (`stage.ts`, `choreo.ts`, `morph.ts`, `particles.ts`, `text.ts`, `timeline.ts`) + `studio/scripts/opus/` |

New video: code in `studio/src/<slug>/`, assets in `studio/public/<slug>/` (load with `staticFile('<slug>/…')`), scripts in `studio/scripts/<slug>/`. Register it in `studio/src/Root.tsx`:
```tsx
<Composition id="<PascalId>" component={<Reel>} durationInFrames={SECONDS * 60} fps={60} width={W} height={H} />
```

## 4. Build rules (each one learned the hard way)

- **Timing:** one plain `.ts` timing module per video (no JSX, no enums; import other `.ts` files *with* the `.ts` extension) holding scene bounds and every sound-event frame. The scenes AND the Node music script import it (Node 22.6+/24 runs `.ts` directly) — that's why hits land on their exact frame.
- **Determinism:** derive everything from `useCurrentFrame()`; seeded PRNG (`mulberry32`) only. Never `Math.random`, `Date`, or react-three-fiber's `useFrame` clock for animation.
- **Animate transform and opacity**; a few pre-blurred glow layers instead of many CSS `blur()` filters; ≤1,400 particles in one SVG for 2D, an InstancedMesh for 3D.
- **Camera shake:** sum of slow sines under a ~20-frame decaying envelope, only on impacts. Never per-frame jitter.
- **Film grain:** a small *soft* noise tile shifted per frame at ~4–5% opacity. Hard per-pixel grain once made a 24 s render 228 MB.
- **Fonts:** `@remotion/google-fonts`. Latin subsets lack glyphs like → ✓ ⇄ — draw those as inline SVG. Rendering needs internet for fonts.
- **Motion blur (2D):** `CameraMotionBlur` from `@remotion/motion-blur` (~5 samples), only on genuinely fast moves.
- **3D:** `CameraMotionBlur` breaks WebGL (too many contexts) — re-pose at ~5 sub-frame times and average instead (`studio/src/opus/stage.ts`). opentype.js can't read variable fonts: use a static TTF and extrude glyph paths with a bevel. drei's MeshReflectorMaterial and PBR-Neutral tone mapping looked wrong; reuse opus's mirror floor and tone curve.
- **9:16:** keep text out of the top ~220 px and bottom ~380 px (app UI covers them), 72 px side margins.
- **Render settings:** `studio/remotion.config.ts` sets H.264 CRF 16, AAC 320k, ANGLE GL and `setColorSpace('bt709')`. Keep bt709 — without it renders come out full-range `yuvj420p` and look washed out on many players.

## 5. Music: synthesized in code, no samples

Copy the closest `studio/scripts/<template>/music.ts` (oscillators, risers, booms, whooshes, reverb, look-ahead limiter, WAV writer, loudness measurement via ffmpeg are all there).
- 44.1 kHz 16-bit stereo WAV, exactly as long as the video, at `studio/public/<slug>/music.wav`; add it with `<Audio src={staticFile('<slug>/music.wav')} />`.
- Master to about **-14 LUFS integrated, true peak below -1 dBTP**; verify with `ffmpeg -i file -af ebur128=peak=true -f null -`.
- Keep one assert-based onset check (like `studio/scripts/mkv/check.ts`): every impact must start within ±1 frame and jump ≥6 dB over the 50 ms before it. A riser that runs straight into a hit fails — cut/duck the bed ~60 ms before each impact ("suck-out").
- You probably can't listen. Balance by the numbers and tell the user the mix hasn't been listened to.

## 6. Verify before the final render

- Render ≥2 stills per scene plus mid-transition frames (`node scripts/mk/stills.ts <CompId> <frames…>` bundles once and is fastest; or `npx remotion still src/index.ts <Id> out.png --frame=N`). **Look at them** (if you can view images) and fix overlaps, the 72 px safe margin, legibility, spelling and empty frames. Iterate until it looks premium. If you can't view images, at least check sizes/duration with ffprobe and ask the user to look.
- Contact sheet from an MP4: `ffmpeg -i x.mp4 -vf "select='eq(n\,A)+eq(n\,B)+eq(n\,C)+eq(n\,D)',scale=960:-1,tile=2x2" -frames:v 1 sheet.png`
- `npx tsc --noEmit` passes.

## 7. Render and deliver

From `studio/`: `npx remotion render src/index.ts <Id> ../outputs/<slug>.mp4 --concurrency=6` (use 4 for 3D). Then:
- ffprobe it: duration = seconds, expected frame count, 60 fps, `yuv420p`, h264 + aac.
- Over ~30 MB? Also make a share copy: `ffmpeg -i in.mp4 -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart out-preview.mp4`
- Report: length, scene list, audio numbers (LUFS, true peak, onset check), deviations from the brief, and that the mix hasn't been listened to.

## 7b. Team mode: the Motion Orchestrator

If the user wants to choose **which model does which job**, cap spending, use cheap or free models, or split the work across agents, use `orchestrator/` instead of building alone. It's vendor-neutral and runs with any AI:
- **Roles:** director, builders, reviewer and escalation.
- **Connections:** paid APIs, free tiers, local models, or `host` (you, through `claim_job` / `submit_job`).
- **Gates:** automatic checks on every job.
- **Budget:** a hard cap.

Drive it through its MCP tools, its HTTP API (`GET /api/ops` lists them) or the CLI (`node orchestrator/bin/mvo.ts`). Setup is in `orchestrator/README.md`. In team mode, you collect the inputs from §1 and the orchestrator does §2–§7.

## 8. Feature tours: "every feature is a whole world"

For products with many features, give each feature its own world: own accent color, optical illusion, visual language and music style, on the brand base and one 120 BPM grid. Template: `studio/src/mkv/` (MK Voice — Nine Worlds, 90 s), brief `briefs/mk-voice-worlds.md`. Its scaffold:
- `src/mkv/timing.ts` — world layout (bar-aligned bounds), `PAD` = 12 frames of overlap for transitions, `WorldEvent` type.
- `src/mkv/worlds/<id>/World.tsx` (uses `useWorldFrame()`, 0 = world start) and `timing.ts` (`EVENTS` in local frames, `HERO_FRAME` for the finale montage); `worlds/index.ts` registry.
- `scripts/mkv/worlds/<id>.ts` — each world's own sound, default `render(ctx: SynthCtx)` (contract: `scripts/mkv/types.ts`); `scripts/mkv/solo.ts <id>` renders one world's audio.
- Framework: `Reel.tsx`, `shell/` (portals, HUD tinted per world, shake from EVENTS), `intro/`, `finale/`, `scripts/mkv/music.ts` (calls every world, loudness-matches worlds, masters) and `scripts/mkv/check.ts`.
- Debug composition `MkvWorld` with `--props='{"id":"<world>"}'` renders one world alone.

Proven illusion menu (one per world): Rubin's vase · Penrose staircase (+ Shepard–Risset tone) · peripheral drift (Kitaoka) · anamorphic type · Droste zoom · scintillating grid · moiré reveal · Necker cube · Kanizsa contours · spectrum moiré tunnel.

If your agent can run parallel sub-agents: write the brief and scaffold yourself, then one framework agent + world agents of 2–3 worlds each, each owning only its own folders (`src/<slug>/worlds/<id>/**`, `scripts/<slug>/worlds/<id>.ts`), no `npm install` during the parallel phase. Otherwise build worlds one after another. Integrate at the end: master music → onset check → full render → contact sheets.
