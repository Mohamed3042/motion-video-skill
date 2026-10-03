# Montage Pro: Eleven Worlds (164 s)

**Concept: the film is cut like a multicamera edit.** Montage Pro syncs cameras by their sound and hands an editor a clean sequence, so the film behaves like one:
- The intro is four out-of-phase camera soundtracks that **lock into sync**.
- Every transition is an editor's cut (match cut, J/L-cut, split edit, whip, smash cut).
- The HUD is NLE chrome: a timeline ruler, a playhead and timecode.
- The finale is a multicam grid of every world, cut on the beat.

As in *MK Voice: Nine Worlds*, every feature group is its **own world**, with its own accent color, optical illusion, visual language and music style. They sit on the product's real Carbon Studio identity and one 120 BPM grid.

**Format:** 164.0 s, 1920×1080, 60 fps, 9,840 frames, H.264 + AAC. Composition `MontageProWorlds` (entry `studio/src/mpw-entry.tsx`). Every frame and every sound is code.

## Brand: Montage Pro Carbon Studio (product DESIGN.md, v0.7.0)

- **Colors:**
  - surfaces: canvas #101211, panel #1b1f1d, raised #252b27, separator #343b35
  - text #ebeae2, muted #a9b2a9
  - **primary amber #edb654** (hover #f6c774), success #a5c9ad, error #ed9690, focus #f8ce81
- **Wordmark:** spaced uppercase **MONTAGE PRO**, with PRO in amber. Weight about 450, letter-spacing ≈ 0.14 em.
- **Type:** the product uses Segoe UI Variable. Use `"Segoe UI Variable Display", "Segoe UI Variable", "Segoe UI", Inter` (Inter loaded as fallback). Timecode and labels use JetBrains Mono.
- **Look:** a restrained dark desktop at NLE density. Controls have 6 px radii and dialogs 9 px. Amber marks actions and selection. Real UI captures are available in `studio/public/mp90/carbon-*.png` and `app-*.jpg` (authored QA projects; label them "Interface capture").
- **World accents** (each world's own hue on charcoal; amber stays the connective thread):

| # | World | Accent | Illusion | Music style |
|---|---|---|---|---|
| 0 | Intro: Phase lock | amber | four drifting waveforms lock | Reich-style phasing loops that lock into one groove |
| 1 | Ingest | parchment #d9c7a1 | emergent image in a SHA-256 hex stream | dry data clicks, tape-machine thumps |
| 2 | Sync (hero) | amber #edb654 | hidden word appears only when waveforms align | four stems enter offset and lock one by one |
| 3 | Review | steel #8fc1d4 | cross-frame continuity (an object crossing 4 camera tiles is continuous only in sync) | tight broken-beat, playhead ticks |
| 4 | Captions & markers | paper #f2efe6 | typoglycemia (scrambled-middle words you can still read) | typewriter + soft keys |
| 5 | Handoff | orange #f0a35e | impossible fork (blivet): three outputs, one package | brass-ish stabs, confident |
| 6 | Sound Lab | sage #a5c9ad | **the soundtrack draws the word in its own spectrogram** | spectral synth: the music is the image |
| 7 | Picture Lab | violet #c79bf2 + RGB | Adelson checker-shadow (same gray, different look) · barber pole (aperture problem) · induced motion | lush synth-pop, chromatic |
| 8 | Library | aqua #7fd1c7 | change blindness (a frozen/black frame you'd miss) · zoetrope | minimal glitch, data |
| 9 | Edit Room | coral #ed9690 | beta movement (two stills alternate into apparent motion: every cut is an illusion) | chopped hip-hop, stutter edits |
| 10 | Profile & Intelligence | focus gold #f8ce81 | Troxler fading (fix on the dot and the clutter fades) | warm keys, piano |
| 11 | Anywhere, private | amber | mirror world: the UI mirrors into Arabic while the timeline keeps running left-to-right | the theme returns, simpler |
| F | Finale | all → amber | multicam grid cut on the beat → wordmark | full theme, big hit, resolve |

## Truthfulness (mandatory; from the product's README, PRODUCT, DESIGN, FEATURE-PROGRAM and the mp90 PROVENANCE audit)

**Allowed claims:**
- **Sync:** sync is by recorded sound, using a coarse chunk vote and then a fine match. It reports confidence, precision and clock drift (drift is measured and reported, not corrected). Every recording session becomes a sync group in shooting order. Weak or unmatched clips are flagged for review. Manual offsets and 1 ms nudges, Undo/Redo.
- **Import and channels:** the day folder has one subfolder per camera or recorder. The analysis channel is auto-best or explicit. Audio routing and delivery presets are separate controls.
- **Review:** source thumbnails beside the synchronized multicam picture with one shared playhead. The preview is approximate; unsupported codecs need a playable proxy.
- **Captions:** SRT/WebVTT import; edit cue text and time; search, shift, split, undo/redo; SRT/VTT export. Markers have labels and notes. Split timing is editorial, not word-level.
- **Handoff:**
  - an editable sequence as **FCP7 XML** (stacked camera tracks, one marker per sync group)
  - a JSON sync report
  - SRT/VTT
  - original media is never modified or re-encoded by sync/export.

  **Do not claim verified import into any specific NLE.**
- **Studio, 30 workspaces** (native capability only; no vendor or competitor names, no "parity", no speed or accuracy numbers):

| Family | Workspaces |
|---|---|
| **Sound** | Audio Repair (noise, hum, clicks, clipping, selected-band spectral repair, before/after compare), Dialogue Mixer (tone and compression), Dialogue Noise, Microphone Alignment (delay, polarity, phase), Speech Cleanup, Room Reduction, Dialogue Leveler, Loudness Delivery (two-pass, measured), Beat Markers (onset candidates) |
| **Picture** | Color Balance (manual primary correction), Reference Color Match, Film Finish (curves, saturation, grain, optional halation), Flicker Reduction, Image Restoration (spatial/temporal noise), Scale & Motion (native scaling/interpolation), Shot Stabilization, Motion Tracking (translation/planar, tracked blur/matte, small-region removal), Title & Lower Third |
| **Library** | Footage Library (keyword search), PC Media Catalog (local speech word timestamps + sampled visual search; timed matches jump to the source), Local Transcription (on the PC, timestamped SRT + text), Media QC & Dailies (black frames, freezes, silence; advisory), Proxy Preparation (H.264 proxies + source links), Verified Ingest (copy + reread both sides, SHA-256; never deletes cards), Timecode Assembly (recorded timecode → aligned FCP7 XML) |
| **Edit** | Camera Director (speaker-energy first cut, minimum shot length), Silence Rough Cut (threshold cuts + editable cut list), Command Launcher (recipes of 1–8 steps), Styled Captions (clean / pop / focus burn-in) |

- **You:**
  - Creative profiles: notes, references, preferences; approve or reject results; suggestions you choose to apply. *Not model training.*
  - The Intelligence helper is rules-based and local (readiness checks, caption spacing cleanup, review markers). Optionally it plans through *your own* configured API endpoint, and you review every change before it applies. No autonomous rendering or cutting.
  - Queue with progress.
- **Platform:** a desktop app, local-first. No cloud, no telemetry; your media stays on your PC. The interface works in English or Arabic, mirroring for Arabic while the timeline and timecode stay left-to-right. Phone-sized layout.

**Never show:**
- competitor or vendor names, parity or "better than" claims
- numbers for accuracy or speed, prices, release or version claims
- "available now", "imports into Premiere", "AI training"
- real people. Use abstract silhouettes and generic sample names ("CAM A", "Episode 2", "Take 03").

## Global rules (same quality bar as briefs/mk-voice-worlds.md)

- Everything is frame-driven with seeded PRNG only. Animate transform and opacity with a few pre-blurred glows. Use CameraMotionBlur only on genuinely fast moves. Shake is a smooth sum of sines over 20 frames, impacts only.
- **Transitions are edits (12 frames, centered on each boundary):** match cut on a shared shape, J/L-cut (the next world's sound leads), whip pan with blur, smash cut to black, a film-gate slip with a sprocket flash, a timeline zoom-through. Each world draws its own entrance and exit pose; the framework blends them.
- **HUD as NLE chrome** (tinted with the world accent):
  - corner brackets at 72 px
  - top-left "MONTAGE PRO · ELEVEN WORLDS"
  - top-right "0N — WORLD" with an act label ("ACT I — THE CUT", "ACT II — THE STUDIO", "ACT III — YOURS")
  - bottom: a slim timeline ruler with a moving playhead, 13 colored segments and HH:MM:SS:FF timecode
  - finish: soft grain at about 4%, vignette, faint scanlines
- **Safe zones:** keep text and UI inside a 72 px margin and out of the top 120 px and bottom 120 px HUD bands.
- **Sound:** 120 BPM, D minor ↔ F major family. Each world's bar-1 downbeat lands on its first frame. Every impact/hit has a clean transient (cut the bed about 60 ms before). Master at -14 LUFS, true peak ≤ -1 dBTP, worlds matched within ±1.5 LU.

## Timeline (frames at 60 fps; beat = 30 f, bar = 120 f)

| Act | World | Frames | Seconds | Length |
|---|---|---|---|---|
| | Intro | 0–480 | 0–8 | 8 s |
| I — THE CUT | 1 Ingest | 480–1080 | 8–18 | 10 s |
| | 2 Sync | 1080–2040 | 18–34 | 16 s |
| | 3 Review | 2040–2640 | 34–44 | 10 s |
| | 4 Captions | 2640–3360 | 44–56 | 12 s |
| | 5 Handoff | 3360–3960 | 56–66 | 10 s |
| II — THE STUDIO | 6 Sound Lab | 3960–5040 | 66–84 | 18 s |
| | 7 Picture Lab | 5040–6120 | 84–102 | 18 s |
| | 8 Library | 6120–6960 | 102–116 | 14 s |
| | 9 Edit Room | 6960–7800 | 116–130 | 14 s |
| III — YOURS | 10 Profile | 7800–8520 | 130–142 | 12 s |
| | 11 Anywhere | 8520–9000 | 142–150 | 8 s |
| | Finale | 9000–9840 | 150–164 | 14 s |

The logo lock is at f9480 (158 s).

Every world opens with a **title moment** in its first ~1.5 s: "0N / 11", the world name in display type, and one promise line. It plays its illusion, shows its features as quick, legible beats with product-UI fragments in the Carbon style (charcoal panels, amber primary buttons, 6 px radii, mono timecodes), and ends on an exit pose for the next cut. The Studio worlds show several tools each. Give each tool a 1–2 s beat with its name as a small mono label ("AUDIO REPAIR", "LOUDNESS DELIVERY"…), so the viewer feels the *range*: 30 tools.

## Worlds

### Intro: Phase lock (0–8 s)
- **f0–30:** black.
- **f30:** a sub hit; four thin waveforms appear, labelled CAM A, CAM B, CAM C and REC.
- **Drift:** they scroll out of phase, and their sounds (four drum and pluck loops) drift against each other like Reich phasing. It's chaotic but musical.
- **f240:** they snap into alignment one by one on the beat. The groove locks.
- **f300:** a hit as the aligned peaks form a vertical amber line, the playhead.
- **f330, wordmark:** **MONTAGE PRO** writes itself along the line, then "Every angle. Every word. In sync."
- **f468–480:** the playhead line becomes the first world's folder edge.

### 1 Ingest (10 s): "Bring the shoot in."
- **The day folder:** it opens, and four camera subfolders fan out with clip-count chips: C1 · C2 · C3 · ZOOM.
- **Verified Ingest, the illusion:** a dense SHA-256 hex stream pours between "Source" and "Copy". Its brightness pattern *is* a giant ✓ that resolves only as the two hashes match.
- **Labels:** "Copy. Re-read. Verify." and "Originals never touched."
- **Exit:** the clips' audio peeks out as four waveform strips.

### 2 Sync (16 s, hero): "Matched by the sound they recorded."
- **The illusion:** four tracks of noisy waveform. Each track carries one quarter of a hidden word's strokes, encoded as amplitude spikes. Misaligned, it reads as noise. As tracks slide into place the spikes stack into **IN SYNC**, readable only at perfect alignment, with an impact. It goes noisy again if nudged.
- **The engine, shown honestly** as visual explanation, not numbers:
  - **COARSE:** 60 s chunks cast votes that stack into a histogram; the tallest cluster wins.
  - **FINE:** a zoom into a short window with sub-sample refinement.
  - **Drift:** a faint sloped line labelled "Clock drift: measured and reported".
- **Groups:** three recording sessions become **sync groups**, colored blocks stacking across cameras in shooting order. One clip goes amber-outlined "Needs review" (weak match).
- **Label:** "Every session. Every camera. In order."
- **Music:** four stems enter one by one offset, then lock exactly on the alignment impact.

### 3 Review (10 s): "See every angle at once."
- **The picture:** a 2×2 multicam grid of abstract scenes (silhouettes, a sweeping light bar) beside source thumbnails, with one shared amber playhead.
- **The illusion, cross-frame continuity:** a light bar sweeps across all four tiles. Out of sync it stutters between tiles; in sync it's one continuous motion.
- **Inspector:** timecode, "Nudge −1 ms / +1 ms" buttons pressed on beats, confidence and precision as words ("Strong", "Review"), Undo/Redo.
- **Small note:** "Preview is approximate; unsupported codecs use a proxy."

### 4 Captions & markers (12 s): "Make every word land."
- **The illusion, typoglycemia:** a caption line appears with scrambled middles ("Evrey anlge. Evrey wrod."), still readable. The editor then fixes it as cue text edits snap letters home.
- **Editor UI:**
  - import chips SRT / WebVTT
  - a cue list with timings
  - search highlights a word
  - Shift (cues slide together), Split (one cue splits in two), Undo/Redo
- **Markers:** markers drop on the timeline with labels and notes ("Laugh — keep", "Cut here?").
- **Export:** SRT / VTT.

### 5 Handoff (10 s): "Hand your editor a clean sequence."
- **The illusion, a blivet (impossible fork):** its three prongs are **FCP7 XML** (editable sequence, stacked camera tracks, a marker per sync group), **SRT / VTT** and **JSON sync report**. They resolve at the bottom into *one* package. The impossible object is the joke: three deliverables, one handoff.
- **Label:** "Your source media, untouched."
- **No NLE brand claims.**

### 6 Sound Lab (18 s): "Thirty tools. Start with the sound."
- **The hero illusion:** a live **spectrogram of the film's own soundtrack** scrolls by. The music in this world is synthesized so its spectrogram literally spells **MONTAGE** in frequencies. The image is computed from the actual audio, not faked.
- **Audio Repair:** a hum line and click specks appear in the spectrogram; a selected band is repaired and they vanish (before/after toggle).
- **Quick tool beats** (one each, name as mono label):
  - DIALOGUE MIXER: tone curve and compression knobs
  - DIALOGUE NOISE
  - MICROPHONE ALIGNMENT: two waves out of phase cancel to a flat line, then align and double; polarity flips
  - ROOM REDUCTION: echo trails collapse into one
  - DIALOGUE LEVELER: an uneven level line smooths under a ceiling
  - LOUDNESS DELIVERY: two passes, the meter lands on "Target", measured
  - BEAT MARKERS: onset ticks rain onto a timeline
  - SPEECH CLEANUP
- **Music:** the spectral synth for the reveal, then a clean groove with each tool beat.

### 7 Picture Lab (18 s): "Then the picture."
- **COLOR BALANCE / REFERENCE COLOR MATCH:** the **Adelson checker-shadow** illusion. Squares A and B look different; a scope and a connecting bar prove they're the same value. Label: "Your eyes adapt. Scopes don't." Then a split-frame color match to a reference.
- **MOTION TRACKING:** the **barber-pole / aperture** illusion. Stripes seem to move up; tracker points and true motion vectors reveal the real diagonal motion. Then a planar track pins a lower third to a moving surface.
- **SHOT STABILIZATION:** **induced motion** (Duncker). A still dot seems to move because the frame shakes; stabilization locks the frame.
- **Other tool beats:** FILM FINISH (grain, halation bloom on highlights), FLICKER REDUCTION (a strobing exposure evens out), IMAGE RESTORATION (noise to clean), SCALE & MOTION, TITLE & LOWER THIRD.
- **Music:** lush, chromatic synth-pop.

### 8 Library (14 s): "Find anything you shot."
- **FOOTAGE LIBRARY:** keyword search.
- **PC MEDIA CATALOG:** type "street", and a sampled visual match plus a spoken-word timestamp **jump to the source**.
- **LOCAL TRANSCRIPTION:** speech becomes timestamped SRT and text, on the PC.
- **MEDIA QC & DAILIES:** **change blindness**. Two near-identical frames alternate with a blank between; one has a frozen region you can't spot. QC flags it instantly ("Freeze 00:12:04:10"), along with a black frame and a silent passage. Advisory.
- **PROXY PREPARATION:** a **zoetrope** of frames spins into motion as proxies are made, with source links.
- **TIMECODE ASSEMBLY:** an LTC barcode becomes aligned tracks.
- **Music:** minimal glitch.

### 9 Edit Room (14 s): "Get to a first cut faster."
- **The illusion, beta movement:** two stills alternate and you see one moving object. "Every cut is an illusion."
- **CAMERA DIRECTOR:** three angle tiles with speech-energy meters; the active angle follows energy with a minimum shot length, building a first cut on the timeline. Label: "a first cut to review".
- **SILENCE ROUGH CUT:** quiet gaps collapse accordion-style and an editable cut list appears.
- **COMMAND LAUNCHER:** a recipe chain of 1–8 steps snaps together and runs.
- **STYLED CAPTIONS:** Clean / Pop / Focus burn-in variants.
- **Music:** chopped hip-hop that stutters exactly on the silence cuts.

### 10 Profile & Intelligence (12 s): "It learns your taste, on your terms."
- **The illusion, Troxler fading:** "Focus here." A fixation dot sits on soft blurry color blobs of UI clutter, which fade from perception while the essential panel stays.
- **CREATIVE PROFILE:** notes, references, preferences; Approve / Reject chips on results; suggestions appear and **you choose** to apply. Small: "Local calibration. Not model training."
- **INTELLIGENCE:** a rules-based helper runs readiness checks, tidies caption spacing and drops review markers. An optional "Your own API endpoint" toggle produces a proposed plan, and you review every change before it applies.
- **QUEUE:** jobs with progress bars.

### 11 Anywhere, private (8 s): "Your media stays yours."
- **The illusion, mirror world:** the interface mirrors into Arabic (right-to-left, Noto Kufi Arabic for the labels). The timeline and timecode keep running left-to-right, unmirrored.
- **Phone layout:** the panel reflows to a phone.
- **Chips:** "No cloud" · "No telemetry" · "On your PC" · "Originals never modified".

### Finale (14 s)
- **150–155.5 s, montage:** a 4×3 multicam grid of every world's hero frame, with amber cut highlights jumping on every beat (Camera Director style).
- **Then:** the grid's tiles slide into sync and collapse into the playhead line.
- **158.0 s (f9480), logo lock:** **MONTAGE PRO** with an impact and a shockwave.
- **End card:**
  - "Every angle. Every word. Your cut."
  - "Sync · Review · Captions · Handoff · 30 Studio tools"
  - "On your PC. In your control."
  - a chip "DESKTOP · LOCAL-FIRST"
- **163–164 s:** fade to charcoal.
- **Music:** the full theme with every world's motif, a big hit at the lock, and a resolve.
