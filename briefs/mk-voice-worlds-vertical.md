# MK Voice — Nine Worlds, vertical cut (90 s, 9:16)

**What this is:** the desktop film `briefs/mk-voice-worlds.md` re-composed for the phone. Same 90 s timeline, same event frames, same 120 BPM soundtrack (`studio/public/mkv/music.wav`, made by `node scripts/mkv/music.ts`), same worlds, same illusions, same copy. Only the picture changes.

**Format:** 1080×1920, 60 fps, 5,400 frames, H.264 + AAC. Composition id `MkVoiceWorldsVertical` (debug: `MkvvWorld` with `--props='{"id":"<world>"}'`). Code lives in `studio/src/mkvv/`, a copy of `studio/src/mkv/`.

**Rule one: reframe, don't crop.** Every scene is re-composed for a tall frame. Never scale a 1920×1080 layout into the middle of the canvas and never letterbox it. The hero illusion goes full-bleed; product UI is re-stacked vertically and enlarged so it reads on a 6-inch screen.

## Shared with the desktop film (do not change)

- `src/mkv/**/timing.ts` is the single source of truth for picture AND sound. The copies in `src/mkvv/**/timing.ts` are one-line re-exports. Never edit them, never add events, never move an event frame.
- Every impact, hit, tick, whoosh and blip keeps its frame: whatever the desktop film does on that frame (title slam, toggle snap, shard alignment, APPROVE flash, logo lock) the vertical cut does on the same frame.
- Each world's title moment (first ~1.5 s), feature beats and exit pose stay on the same frames. The exit pose is what the portal transition in `shell/portals.tsx` picks up, so it must stay centred and recognisable.
- Brand, accents, fonts, copy and the truthfulness rules of `briefs/mk-voice-worlds.md` apply unchanged. Only the capabilities listed there may appear. No celebrity or real-person names, no invented stats, no "available now".

## Canvas and safe frame

`src/mkvv/brand.ts` exports `W = 1080`, `H = 1920`, `SAFE = 72`, `SAFE_TOP = 220`, `SAFE_BOTTOM = 380`, `SAFE_Y0 = 220`, `SAFE_Y1 = 1540`. `shell/util.ts` exports `CX = 540`, `CY = 960`.

- **Text, UI cards, labels, buttons:** inside x ∈ [72, 1008] and y ∈ [220, 1540]. Reels/TikTok/Shorts cover the top ~220 px and bottom ~380 px with their own UI.
- **Full-bleed art** (illusions, backgrounds, glows, tunnels, grids) uses the whole 1080×1920 canvas.
- **Phone legibility** (1080 px wide ≈ a 390 pt screen). Desktop sizes are too small:
  - world title: ≥ 150 px Inter 900 (long names such as TEXT TO SPEECH or VOICE ARCADE break onto two lines, ≥ 120 px)
  - promise line under the title: ≥ 40 px
  - UI card body text: ≥ 28 px; small meta labels ≥ 22 px; mono labels ≥ 20 px
  - UI cards 860–936 px wide; toggles, buttons, tabs ≥ 64 px tall
  - Press Start 2P (Arcade): ≥ 24 px
- Keep the brand base: #121212 / #000000 background, #181818 surface, #242424 controls, #1ED760 primary buttons, pill tabs.

## Vertical global layers (framework)

- **HUD:** corner brackets frame the safe area (72, 220) to (1008, 1540). Inside it: top-left "MK VOICE · NINE WORLDS" and top-right "0N — WORLD NAME" on one row near y 250; bottom-left "● LOCAL" + timecode and bottom-right "WINDOWS · LOCAL PREVIEW" on one row near y 1500; the 11-segment progress bar just above y 1540. Mono 20–22 px. Tinted by the current world's accent.
- **Finish:** grain tile at ~4%, black vignette, very faint scanlines. Vignette ellipse tuned for a tall frame.
- **Camera shake** keeps its amplitudes (px) and its 20-frame decaying envelope.
- **Portals** (12 frames centred on each boundary) keep their doorway sequence: amber ring dive, vase contour → stair edge, staircase → signal ring, ring → letter shards, shards → tunnel frames, tunnel → CRT power-on, CRT collapse → grating, grating → cube edge, cube → page turn, pages → nine rings + light flash. Geometry is re-built for 1080×1920 and stays centred on (CX, CY).

## Vertical direction per section

| Section | What changes for portrait |
|---|---|
| Intro | The green line still runs edge to edge (1080 px) and splits into nine strands that curl into nine concentric rings sized to fill the tall frame (dive zoom must cover the diagonal). "MK Voice": mark above the wordmark, not beside it. Tagline in the safe frame. |
| 1 My Voice | Rubin's vase is naturally tall: scale it up, vase waveform contour centred, profile card, pill tabs ("Profiles · Setup · Intake · Compare") and "Character A / B / C" re-stacked in the lower half. |
| 2 Clone Lab | The isometric Penrose staircase fills the tall frame; the four labelled flights SET UP · RECORD · CALIBRATE · TRAIN; each lit step expands into a full-width panel placed above or below the stairs, never over the orb. |
| 3 Live | Rings full-bleed. Signal path MIC → VOICE → OUTPUT as a vertical chain or a full-width compact row, live-monitor waveform under it, toggles (Echo cancellation, Monitor, Overdrive) stacked full-width, "Renderer · GPU" chip, Live words panel growing smoothly. |
| 4 Text to speech | Anamorphic shards align into two stacked lines "Type it." / "Hear it." (Inter 900, "Hear it." in Instrument Serif Italic). Text field and "Generate speech" button full-width; output row with play button below. |
| 5 Training | Droste recursion with a portrait-aspect panel inside itself; gates PREPARE → TRAIN → LISTEN stacked top to bottom along the tunnel; checks "Data ✓ · Model ✓ · Storage ✓ · Listening ✓" as a list; "Real gates, not guesses."; progress ring. |
| 6 Voice Arcade | CRT fills the tall frame; scintillating grid floor takes the lower two thirds in perspective; stage map STAGE 1 → 2 → 3 vertical; "SELECT YOUR TAKE" 8 tiles as 2 columns × 4 rows (or 4 × 2 if legible); SELECT / APPROVE / RESET and the TOOLS shelf below. |
| 7 Evolution | Gratings A and B slide across each other; the moiré resolves into a giant stacked "A ⇄ B" (A on top, B below, arrows drawn as SVG). Waveform rows "A · Original" / "B · Candidate" stacked; "New experiments" and "Saved results" as stacked lists. |
| 8 Settings | Necker cube centred in the upper half, status rows (Voice engine · GPU acceleration · Microphone · Storage) stacked below, tabs "Overview · Audio tools · Storage · About" as a pill row, local-storage bar, "Runs on your PC." |
| 9 Guide | Kanizsa discs and the illusory square centred; search field full-width typing "How do I calibrate?"; FAQ cards fan out as a vertical deck; chips "Illustrated · Searchable". |
| Finale | Montage of the nine hero frames (`HERO_FRAME` of each world), one beat each, through portal wipes; rings converge; logo lock at frame 4920; end card stacked: mark, "MK Voice" (Inter 900), "Nine worlds. One voice." (serif italic accent), "Your voice. Your studio. On your PC.", chip "WINDOWS · LOCAL PREVIEW", "Made for your own recordings." |

## Build and check rules

- Everything is driven by the frame number. Seeded PRNG (`mulberry32`) only, never `Math.random` or `Date`.
- Animate transform and opacity; a few pre-blurred glow layers instead of many CSS `blur()` filters. `CameraMotionBlur` (~5 samples) only on genuinely fast moves.
- Latin font subsets lack → ✓ ⇄ — draw those as inline SVG.
- No leftover 1920×1080 assumptions: grep your folders for `1920`, `1080`, `960`, `540`, `W / 2`-style centres written as literals, and for layouts that only fit a wide frame.
- Verify with stills, and look at them: `cd studio && node scripts/mkvv/stills.ts world <id> <local frames…> --tag=<id>` renders local frames of one world; `node scripts/mkvv/stills.ts <global frames…> --tag=<tag>` renders the full vertical comp (with HUD, finish and portals). Output goes to `out/stills/`. Check at least the title moment, each feature beat, the exit pose and `HERO_FRAME`. Fix overlaps, clipped text, anything outside the safe frame, empty frames, spelling.
- `cd studio && npx tsc --noEmit` must pass.
- Keep `setColorSpace('bt709')`; do not edit `studio/remotion.config.ts`.

## Deliverables

- `outputs/mk-voice-worlds-vertical.mp4` (1080×1920, 60 fps, 90.0 s, yuv420p, h264 + aac, bt709) and a share copy under ~30 MB.
- A poster frame and contact sheets used for review.
- Report: length, section list, audio numbers (LUFS, true peak, onset check from `node scripts/mkv/check.ts`, which is unchanged because the audio is unchanged), deviations from this brief, and that the mix has not been listened to.
