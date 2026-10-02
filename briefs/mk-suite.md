# MK Suite — brand motion reels (brief)

Three 20 s reels (1920×1080, 60 fps, 1200 frames) built in Remotion: `MkVoice`, `MkMontage`, `MkSuite`.
Source of truth: `MK Suite web app /catalog.json`, `web/index.html`, `web/styles.css`, `web/suite.js` copy, `web/art/devices.png`, favicon (`.build/live-phone-recovery/favicon.svg`).

## Brand system (extracted)

**Palette — light theme (`:root`)**
| token | hex | use |
|---|---|---|
| paper (bg) | `#faf9f7` | Suite light scenes |
| surface | `#ffffff` | cards, panels (light) |
| rail | `#f1f0ee` | gradient edge |
| ink | `#101319` | type on light |
| sub | `#555f70` | secondary type |
| line | `#dddfe3` | borders |
| MK red (primary) | `#ed3f2b` | accent, periods, progress bar (Suite) |
| green | `#4aa721` | status / "ready" |

**Palette — dark theme (`[data-theme=dark]`)**: night `#17181c`, surface `#202227`, raised `#292c32`, soft `#363941`, ink `#f3f4f6`, sub `#bac1ce`, line `#3b3e46`, red `#ff5541`, green `#84cf54`; deepest bg `#0c0d10`.

**Product hues** (sampled from the product art in `devices.png`; used as deep→bright icon gradients and scene glows):
MK Voice violet `#1a0936 → #41147f → #7a3cf0`, glow `#b58cff` · Montage Pro teal `#012e37 → #017281 → #02bcc7`, glow `#7ff3f7` · MK Editor orange `#cf5003/#f4903d` · MK Tones amber `#d79718` · MacroForge blue `#60a5fb` · CharForge pink `#f197c8`. The other 11 products extend the same recipe (documented in `src/mk/brand.ts`).
Montage camera colours: CAM A teal `#02bcc7`, CAM B amber `#fda045`, CAM C violet `#b58cff`, AUDIO ice `#e6f6f7`; markers MK red.

**Type**: Inter (the brand ships InterVariable — exact Google Fonts match) 400–800; headlines 800 with −0.045 em tracking (brand h1 −0.035 em), labels 600 uppercase +0.16–0.2 em. Support face for timecodes only: JetBrains Mono 500.

**Logo**: the brand favicon — a monoline "MK" (`M10 46V18l13 15 13-15v28 M43 18v28 m1-13 12-15 M44 33l12 13`, stroke 4, round joins) on a `#17181c` rounded square (rx 13/64). Used: drawn stroke-by-stroke then plated (Suite open), locked with particles + shockwave (Suite end). The UI's typographic "MK" (Inter 700, −0.08 em) heads every panel title bar. Product reels lock on the product icon instead of the MK mark.

**Icon style**: rounded square (24 % radius), deep→bright product gradient, soft top highlight, white monoline glyph on a 24-unit grid.

**Tone of voice** (from the site): calm, plain, honest, short sentences — "Your tools. One place." · "Make room for your next idea." · "MK Suite · Your tools, together." · "A catalog listing is not a download."

**Motion personality**: confident and precise, never frantic. Everything springs or expo-eases in; UI pieces snap with small overshoot; designed 12-frame transitions (zoom-through + white flash, directional-blur whip, iris with glowing ring, flash, timeline-playhead wipe for Montage). Real motion blur (CameraMotionBlur, 5 samples) on title slams, kinetic words and flying tiles. Smooth-noise camera shake (14 px impacts, 6–9 px hits). Global finish on every frame: corner brackets, HUD text, blinking ● local-preview timecode, glowing progress bar, pre-made grain texture (7 %, shifted per frame), vignette, faint scanlines. 72 px safe margin.

## Music (synthesized from scratch, 120 BPM grid = 30 frames/beat)
- **MK Voice** — intimate and warm, D minor → F major. Formant "ah" choir pad that morphs a→o→i while the take flows through the conversion workflow; half-time kick/rim, soft hats, 8th-note Karplus-Strong plucks; pitched plucks for each icon bar; riser → boom on the title; three building hits on ORGANIZE/PREPARE/CONVERT; boom + shimmer on the end lock; resolves on a held Fmaj9.
- **Montage Pro** — tight and rhythmic, A minor → C major. Tension intro (low drone, clock ticks, swishes as each camera strip arrives), riser into a slate clap + boom; four-on-the-floor with claps, 16th hats, side-chained 8th bass, offbeat e-piano stabs; scan sweep, three "snap" hits as clips lock into sync, marker plinks, export clicks; boom + shimmer on the end lock, held Cmaj9.
- **MK Suite** — bright and uplifting, C major. Pen-scribble as the mark draws, soft boom + shimmer on the mark lock; groove with plucky arps; 17 ascending pentatonic plucks as the product tiles land; hits on CREATE/WORK/GROW; the Voice choir returns in the Voice section, snaps in the Montage section; final boom on the mark lock and a held Cmaj9.
- Whoosh on every cut (energy peaks on the cut frame). Mastered to −14 LUFS, true peak ≤ −1.5 dBTP.

## On-screen copy (exact)

HUD on all reels: top-left "MK Suite · {MK Voice | Montage Pro | Product family}", top-right "{NN} — {scene}", bottom-left "● Local preview {timecode}", bottom-right "Windows · v1.37.26" / "Windows build · 0.5.0" / "17 products · One catalog".

### MK Voice (`MkVoice`)
1. Signal — "Your own voice recordings."
2. Title — "MK Suite · Audio & video" / **MK Voice** / "Organize and process your own voice recordings in a local studio."
3. Library — "Local voice library" / **Your recordings, organized.** / "Every take, in one local library." Panel "Voice library" + "Local"; sample takes: Narration — take 01 · Podcast intro · Character read — warm · Audiobook, chapter 2 · Studio session 4 (illustrative names, the user's own recordings).
4. Conversion — "Voice conversion workflows" / **Shape a take, step by step.** / nodes "Source · Your recording", "Workflow · Voice conversion", "Output · Converted take" / "Processing depends on compatible hardware and separately authorized models and recordings."
5. Dataset — "Dataset preparation" / **From recordings to a dataset.** / clip 01–06 / panel "Training controls" / chips "Dataset preparation", "Training controls".
6. Kinetic — **ORGANIZE. PREPARE. CONVERT.**
7. End — **MK Voice** / "Your own voice recordings, in a local studio." / "Windows · Local preview 1.37.26" / "No voice packs or likeness guarantees are included."

### Montage Pro (`MkMontage`)
1. Slate — CAM A / CAM B / CAM C / AUDIO with mismatched timecodes; slate "MULTICAM · SCENE 01", "Take 01", "4 SOURCES".
2. Title — "MK Suite · Audio & video" / **Montage Pro** / "Align multicamera recordings and prepare an editing handoff with captions and markers."
3. AudioSync — "AudioSync Pro multicamera alignment" / **Multicamera recordings, aligned.** / panel "Multicam timeline", "ANALYZING AUDIO" → "Aligned".
4. Select — "Camera and audio-channel selection" / **Pick the angle. Pick the channels.** / "SELECTED", "PROGRAM", panel "Audio channels" CH 1–4 (Camera mic, Lav 1, Lav 2, Room).
5. Markers — "Captions and markers" / **Markers and captions, on the timeline.** / markers Intro · Interview · B-roll · Close; tracks VIDEO / AUDIO / CAPTIONS (caption blocks show "CC" + placeholder lines, no words) / "Automatic transcription is not included."
6. Handoff — "FCP7 XML, caption and marker exports" / **Prepare the editing handoff.** / cards "FCP7 XML", "Captions", "Markers" / chip "Editing handoff prepared".
7. End — **Montage Pro** / "Align multicamera recordings. Hand off with captions and markers." / "Windows build · Local preview 0.5.0" / "Automatic transcription is not included."

### MK Suite (`MkSuite`)
1. Mark — **MK Suite** / "Your tools. One place."
2. Library — "MK Suite catalog" / **17 products. One catalog.** / all 17 catalog names.
3. Families — **CREATE. WORK. GROW.** then cards "Create. — Make and refine creative work." (5), "Work. — Plan, automate and organize." (9), "Grow. — Research and move forward." (3), with product names.
4. MK Voice — "Featured · Local preview" / **MK Voice** / catalog description / chips: Local voice library · Voice conversion workflows · Dataset preparation and training controls.
5. Montage Pro — "Featured · Local preview" / **Montage Pro** / catalog description / chips: AudioSync Pro multicamera alignment · Camera and audio-channel selection · FCP7 XML, caption and marker exports.
6. End — **MK Suite** / "Your tools, together." / "17 products · Local previews" / "A catalog listing is not a download. Availability varies by product."

## Truthfulness guardrails (deliberately avoided)
No "available now", download/install CTAs, prices, plans or "subscription"; no URLs; no stats other than the catalog count (17) and catalog versions; no testimonials. MK Voice: no voice packs, no "sound like anyone"/cloning or likeness claims, works on the user's own recordings, hardware/authorization limit shown. Montage Pro: no automatic transcription (stated on screen; caption blocks carry no generated words), no Premiere naming, no macOS claim (Mac runtime unverified), Windows build 0.5.0 only. Products are labelled local previews throughout.
