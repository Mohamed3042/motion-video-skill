# MK Voice — Nine Worlds (90 s)

**Concept:** every MK Voice feature is its own world. Each world has its own color, its own optical illusion, its own visual language and its own music style. They all sit on the app's real identity (Spotify-style black, white and bright green) and are stitched together by one 120 BPM groove and one camera that keeps travelling *through* each world into the next.

**Format:** 90.0 s, 1920×1080, 60 fps (5,400 frames), H.264 + AAC. Composition id `MkVoiceWorlds`. Every frame and every sound is made in code.

## Brand

- **App identity** (from the MK Voice design notes):
  - background #121212, sidebar #000000, surface #181818, control #242424, selection #2a2a2a
  - text #ffffff, secondary #b3b3b3, divider #333333
  - primary **#1ED760** (green)
- **Mark:** a green waveform glyph (7 rounded vertical bars, symmetric heights) on a black rounded square (radius 22%). Wordmark "MK Voice" in Inter 800.
- **Type:** Inter (400–900) for UI and headlines, JetBrains Mono for labels and timecodes. Fonts that appear in one world only:
  - Instrument Serif Italic (TTS)
  - Press Start 2P (Arcade)
  - Noto Kufi Arabic (the word العربية in Clone Lab)
- **World accents** (each world's own hue on black; green stays the connective thread):

| # | World | Accent | Illusion | Music style |
|---|---|---|---|---|
| 0 | Intro | all | spectrum moiré tunnel | Shepard riser + sub hit |
| 1 | My Voice | amber #FFB547 | Rubin's vase | warm FM Rhodes, soft groove |
| 2 | Clone Lab | ice #4FE3FF | Penrose impossible staircase | Shepard–Risset endless glissando, glass arps |
| 3 | Live | green #1ED760 | peripheral drift ("rotating snakes") | four-on-the-floor house, sidechained bass |
| 4 | Text to speech | pink #FF5FA2 | anamorphic typography | type clicks, formant "vowel" synth chords |
| 5 | Training | orange #FF7A2F | Droste infinite zoom | accelerating 16th arps, building kick |
| 6 | Voice Arcade | yellow #FFE14D | scintillating grid | chiptune square lead, 8-bit drums |
| 7 | Evolution | violet #A77BFF | moiré interference reveal | stereo ping-pong A/B call-and-response |
| 8 | Settings | silver #E6E6E6 | Necker cube | minimal clicks, sine blips, servo whir |
| 9 | Guide | mint #2EE6A8 | Kanizsa illusory contours | soft bells, page swishes, pad |
| 10 | Finale | all → green | rings collapse into the mark | full theme, big boom, resolve |

## Truthfulness rules (mandatory)

Only these real capabilities may appear. They come from the app's own README, DESIGN, WORKSPACES03 and LIVE-REPAIR notes.

- **My Voice:** profiles, setup, intake and comparison. Saved profile and characters.
- **Clone Lab:**
  - The flow is Set up → Record → Calibrate → Train, one main task at a time.
  - Microphone selection plus a short input test in setup.
  - Recorded, accepted and excluded time, each with its own meaning.
  - English and Arabic (العربية) normal ranges.
- **Live:**
  - Streaming, conversion and evaluation views.
  - A compact signal path (mic → voice → output), monitor and cleanup controls, echo cancellation.
  - An Overdrive toggle.
  - An honest GPU/CPU renderer status.
  - A Live words view with adjustable text and panel size.
- **Text to speech:** a tab where you type text, pick a voice and generate.
- **Training:** Prepare → Train → Listen, with real gating (data, model, storage and listening checks).
- **Voice Arcade:** stages, optional tools, selection, approval and reset.
- **Evolution:** new experiments and saved results; compare an original against a candidate. Audio editor · web: trim, export, compare.
- **Settings:** Overview · Audio tools · Storage · About. Status is shown as the engine reports it.
- **Guide:** one illustrated Guide with searchable FAQs.
- **Platform:** a local desktop app on Windows (local engine on your PC), currently a local preview.

**Never show:**
- celebrity or real-person names, faces or voices, and no "clone anyone"
- voice counts, voice packs, latency numbers, prices, "available now"
- noise reduction, FabFilter or effects as active features
- invented stats

Sample UI text is generic placeholder (e.g. "My voice", "Take 03", "Character A"). Faces are abstract silhouettes, never photos.

## Smoothness and finish (same bar as briefs/ai-in-public.md)

- Everything is driven by the frame; seeded PRNG only, never Math.random.
- Animate transform and opacity, plus a few pre-blurred glow layers. Use CameraMotionBlur (~5 samples) only on genuinely fast moves.
- Camera shake is smooth (a sum of sines) under a 20-frame decaying envelope, only on impacts.
- **World-to-world transitions** (12 frames, centered on each boundary) are "portals": the outgoing world's motif becomes the doorway into the next. The 8 doorways are:
  - vase contour → stair edge
  - staircase → signal ring
  - ring → letter shard
  - shard → tunnel frame
  - tunnel → CRT screen
  - CRT → grating
  - grating → cube edge
  - cube → page
- **Global HUD** (tinted with the current world's accent):
  - corner brackets at the 72 px margin
  - top-left "MK VOICE · NINE WORLDS"
  - top-right "0N — WORLD NAME"
  - bottom-left "● LOCAL" plus a running timecode
  - bottom-right "WINDOWS · LOCAL PREVIEW"
  - a bottom progress bar split into 11 segments (intro, 9 worlds, finale)
- **Finish:** soft grain tile at ~4%, a black vignette, very faint scanlines.

## Timeline (frames at 60 fps; 1 beat = 30 f, 1 bar = 120 f)

| Section | Frames | Seconds |
|---|---|---|
| Intro | 0–360 | 0–6 s |
| 1 My Voice | 360–840 | 6–14 s |
| 2 Clone Lab | 840–1320 | 14–22 s |
| 3 Live | 1320–1800 | 22–30 s |
| 4 Text to speech | 1800–2280 | 30–38 s |
| 5 Training | 2280–2760 | 38–46 s |
| 6 Voice Arcade | 2760–3240 | 46–54 s |
| 7 Evolution | 3240–3720 | 54–62 s |
| 8 Settings | 3720–4200 | 62–70 s |
| 9 Guide | 4200–4620 | 70–77 s |
| Finale | 4620–5400 | 77–90 s |

Every world opens with a **world title moment** in its first ~1.5 s: a big world name in Inter 900, the index "0N / 09" in mono, and a one-line promise. It then plays its illusion, shows 2–3 feature beats with product-UI fragments in the app's style (dark cards, #242424 controls, green primary buttons, pill tabs), and ends on an exit pose that becomes the portal.

## The worlds

### 0. Intro (0–6 s), "One voice. Nine worlds."
- **0.5 s (f30), hook:** the screen is black. On a sub impact, a single green horizontal line ignites edge to edge.
- **The nine strands:** the line vibrates into a waveform that splits into nine parallel strands, one per world accent. They curl into a rotating tunnel of nine concentric rings, rotating in alternating directions, so their dashed patterns form a living moiré.
- **3.0 s, title:** "MK Voice" slams in at the center, with the mark beside it.
- **4.5 s:** "One voice. Nine worlds." in mono caps.
- **5.6–6.0 s:** the camera dives into the amber ring, the portal to world 1.
- **Sound:** sub impact at f30, then a Shepard-tone riser from 1.0 to 5.8 s, a title hit at f180, and a whoosh into the boundary.

### 1. My Voice (6–14 s), "the mirror", amber
- **Illusion, Rubin's vase:** two abstract facing human profiles (flat silhouettes, generic) sit on amber. The negative space between them is a vase whose contour is a live waveform. As the music plays, the contour ripples, so the eye flips between faces and vase.
- **Title:** "MY VOICE" · "Your voice, learned."
- **Feature beats:**
  - The vase contour detaches and becomes the waveform in a profile card, "My voice · Personal profile".
  - Pill tabs sweep across: "Profiles · Setup · Intake · Compare".
  - The silhouettes re-tint as characters ("Character A / B / C") on beat while the vase reshapes: "Your profile. Your characters."
- **Exit:** the vase contour straightens into a diagonal edge, the first step of the staircase.
- **Sound:** warm FM-Rhodes chords (Am9 → Fmaj9 → C → G6), brushed hats and a soft kick. A chord stab on each card or tab landing.

### 2. Clone Lab (14–22 s), "the endless staircase", ice cyan
- **Illusion, Penrose staircase:** an isometric impossible staircase. Its four flights are labelled SET UP · RECORD · CALIBRATE · TRAIN, and a glowing ice orb climbs it forever, a seamless loop. The music plays a Shepard–Risset glissando that rises endlessly with it.
- **Title:** "CLONE LAB" · "One main task at a time."
- **Feature beats** (each step lights as the orb passes and expands into a panel):
  - **Set up:** a mic selector chip and a short input-test meter.
  - **Record:** a red record dot, a waveform drawing, and three stacked meters with plain labels: "Recorded", "Accepted", "Excluded".
  - **Calibrate:** two range bars, "English" and "العربية" (Noto Kufi Arabic), fill to a green "ready".
  - **Train:** a door at the top glows.
- **Exit:** the staircase spins into a ring of segments, the Live drift ring.
- **Sound:** an endless Shepard–Risset rise, glassy plucked arps, and a crystal tick when each step label lights (4 ticks).

### 3. Live (22–30 s), "the signal city", green
- **Illusion, peripheral drift:** Kitaoka-style concentric rings of asymmetric segments (black, dark gray, green, white) fill the frame. For one bar they are completely static but appear to rotate. On the downbeat Live starts and they really turn.
- **Title:** "LIVE" · "Speak. Hear the voice. In real time."
- **Feature beats:**
  - A compact signal path of three nodes, MIC → VOICE → OUTPUT, with a pulse travelling along the line and a scrolling green live-monitor waveform below.
  - Toggles snap on: "Echo cancellation" and "Monitor". Then an animated **Overdrive** toggle flips with a surge and a glow ring. A small honest status chip reads "Renderer · GPU".
  - A "Live words" panel whose text size grows smoothly while its panel resizes: "Live words, sized your way."
- **Exit:** a letter in the live words detaches as a shard, the start of the TTS anamorphosis.
- **Sound:** four-on-the-floor house at 120 BPM, a pumping sidechained bass, and a filter rise into an impact when Overdrive flips.

### 4. Text to speech (30–38 s), "the anamorphic room", pink
- **Illusion, anamorphosis:** pink letter shards float scattered in 3D (CSS perspective), like a random sculpture. The camera orbits, and at one exact frame (an impact) they align perfectly into "Type it. Hear it." (Inter 900 with "Hear it." in Instrument Serif Italic). Then they drift apart again.
- **Title:** "TEXT TO SPEECH"
- **Feature beats:**
  - A text field types a line (placeholder copy, e.g. "Welcome to my channel."), each character with a soft click.
  - A green "Generate speech" button press. The letters drop onto a baseline and each one becomes a waveform bar.
  - An output row appears with a play button and a short timecode.
- **Exit:** the waveform bars stand up into nested frames, the Training tunnel.
- **Sound:** a click per typed character (synced), a glassy pluck melody, formant "vowel" synth chords that morph a → e → o (no words, no vocals), and an impact on the anamorphic alignment frame.

### 5. Training (38–46 s), "the infinite tunnel", orange
- **Illusion, Droste effect:** a training panel contains a smaller copy of itself, recursively. The camera zooms continuously and seamlessly (a log-periodic loop), so it feels like falling forever through the model.
- **Title:** "TRAINING" · "Prepare. Train. Listen."
- **Feature beats:**
  - Three gates sit along the tunnel: PREPARE → TRAIN → LISTEN.
  - Gate checks light up one per beat: "Data ✓", "Model ✓", "Storage ✓", "Listening ✓" (✓ as SVG).
  - Line: "Real gates, not guesses."
  - A progress ring sweeps.
- **Exit:** the tunnel's innermost frame becomes a glowing CRT screen.
- **Sound:** a 16th-note arpeggio that accelerates (rising filter), a building kick, a hit on each check (4), and a riser into the boundary.

### 6. Voice Arcade (46–54 s), "the arcade", yellow CRT
- **Look:** a retro CRT world with curved-screen vignette, RGB scanlines, Press Start 2P type and a pixel-snapped layout.
- **Illusion, scintillating grid:** the arcade floor is a perspective grid of gray bars with white dots at the intersections. Phantom dark dots appear to flicker at the intersections.
- **Title:** "VOICE ARCADE" · "INSERT VOICE" blinking.
- **Feature beats:**
  - A stage map: STAGE 1 → STAGE 2 → STAGE 3 with a moving cursor.
  - A "SELECT YOUR TAKE" grid of 8 pixel tiles ("TAKE 01…08"). A cursor hops, then SELECT → **APPROVE** (a power-up flash) → RESET (the tiles shuffle back).
  - A side shelf labelled "TOOLS".
- **Exit:** the CRT image collapses to a horizontal line that splits into fine grating lines.
- **Sound:** chiptune square-wave lead, noise-channel drums, a coin "bling" on SELECT, and a power-up arpeggio on APPROVE.

### 7. Evolution (54–62 s), "the interference lab", violet
- **Illusion, moiré reveal:** two fine line gratings, A (original) and B (candidate), slide across each other. Their interference makes large ghost shapes, and at the impact the moiré resolves into a giant "A ⇄ B".
- **Title:** "EVOLUTION" · "Experiment. Compare. Keep what's better."
- **Feature beats:**
  - Two waveform rows, "A · Original" and "B · Candidate", with play buttons.
  - A green "Run comparison" press (impact) sends a scan line across both rows.
  - Two columns: "New experiments" and "Saved results", with result chips stacking.
  - A small chip: "Audio editor · trim · export · compare".
- **Exit:** the gratings rotate into a wireframe cube edge.
- **Sound:** a ping-pong motif (A hard left, B hard right) in call-and-response, a phaser sweep, and an impact on Run comparison.

### 8. Settings (62–70 s), "the engine room", silver
- **Illusion, Necker cube:** a large wireframe cube whose depth reading flips on the beat. The shading swaps which face is "front", with no actual rotation, three times. It then solidifies into a brushed-silver engine block that rotates for real.
- **Title:** "SETTINGS" · "Status straight from the engine."
- **Feature beats:**
  - Four category tabs light in sequence: "Overview · Audio tools · Storage · About".
  - Status rows with small status lights: Voice engine · GPU acceleration · Microphone · Storage. Present them as the engine reporting status, not marketing claims.
  - A local-storage bar.
  - Line: "Runs on your PC."
- **Exit:** the cube unfolds flat into a page.
- **Sound:** minimal techno: clicks, a sine blip per status row, a soft servo whir on each cube flip.

### 9. Guide (70–77 s), "the library", mint
- **Illusion, Kanizsa contours:** mint "pac-man" discs rotate into place, and an illusory white square appears that isn't drawn. It then becomes a page.
- **Title:** "GUIDE" · "Every answer in one place."
- **Feature beats:**
  - A search field types a placeholder question ("How do I calibrate?").
  - FAQ cards fan out like a deck. An illustrated page flips.
  - Chips: "Illustrated · Searchable".
- **Exit:** the pages scatter into nine colored rings for the finale.
- **Sound:** soft bells, page-flip swishes, a gentle pad and a light groove that drops out at the end for the finale lift.

### Finale (77–90 s), "nine worlds, one voice"
- **77.0–81.5 s, montage:** a rapid recap of the 9 worlds, one beat each (30 f). Each shows its hero frame through a portal wipe, with its name flashing in its accent.
- **81.5–82.0 s:** the nine accent rings converge.
- **82.0 s (f4920), logo lock:** the rings collapse into the green mark. Big boom, a shockwave ring and a green bloom.
- **83–88 s, end card:**
  - "MK Voice" in Inter 900
  - "Nine worlds. One voice." in serif italic accent
  - "Your voice. Your studio. On your PC."
  - a chip "WINDOWS · LOCAL PREVIEW"
  - a subtle line "Made for your own recordings."
- **88.5–90 s:** fade to black as the music resolves.
- **Sound:** all the world motifs layered into one full theme (Rhodes chords, house groove, chip-lead flourish, Shepard shimmer). Boom plus shimmer at f4920, then a held resolve chord with a reverb tail to 90.0 s.

## Music (one continuous 90 s track, 120 BPM, A minor ↔ C major)

- Each world owns its sound design inside its time range. Each world's bar 1 downbeat lands exactly on the world's first frame.
- Boundaries get a whoosh that peaks on the boundary frame plus a short impact.
- Every event frame lives in code: `src/mkv/timing.ts` holds the global layout, and each world's `timing.ts` holds its own events. Both the picture and the synth import them.
- **Master:** about -14 LUFS integrated, true peak below -1 dBTP, 44.1 kHz 16-bit stereo, exactly 90.0 s.
- **World balance:** each world segment within ±1.5 LU of the others.
