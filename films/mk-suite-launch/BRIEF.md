# MK Suite: launch film (120 s)

**What it is:** the launch film for the next MK Suite update: the reimagined launcher. MK Suite is the owner's monetization suite, a family of desktop tools for different audiences, like Adobe's suite but with distinct use cases. The film sells the new launcher and the idea of "one place for every tool you need, built the way you want".

**Why the earlier films failed (don't repeat this):**
- They showed flat, clip-art imitations of products in off-brand pastel colours, with "DEMO" badges everywhere.
- They packed 23 products into 90 s, which played like a slideshow.
- They never showed the real new UI.

**This film's rule:** the real new UI is the star. Every interface shot uses the 31 actual concept screens, presented cinematically: floating windows in 3D space, real camera moves, exploded layers, cursor interactions and match cuts. It should look and pace like a top-tier product launch film. Give shots air; never more than one idea on screen at a time.

**Format:** 120.0 s, 1920×1080, 60 fps (7,200 frames), H.264 + AAC. Composition `MkSuiteLaunch`, source in `studio/src/mks/`.

## Assets
- `studio/public/mks/screens/<id>.jpg` holds the 31 concept screens at 3172×1984 (2× lanczos of the 1586×992 originals).
- The three phone concepts (22, 23, 24) are 1984×3172.
- All crop rectangles are given in **1× source pixels** (1586×992, or 992×1586 for phones). The kit's `<Crop>` scales them.
- Screen list and meaning: `studio/src/mks/screens.ts`. All launcher artwork needed to render is included in this project.

## Brand
- **Colours:** the launcher's own UI: near-black stage `#07090A`, panels `#121212` / `#181818`, lines `#2A2A2A`, text `#FFFFFF` / `#B3B3B3`, and the MK green `#1ED760` for actions and focus.
- **Product art colours:** MK Voice silver and green ribbon · Montage Pro cyan film · MK Editor orange facets · MK Tones blue notes · CharForge marble bust · MacroForge gold cubes · Reclaim silver box · Job Engine / Orbit violet planet · Cake Studio pink · MK Marketplace bag · MK Educate green book · Quotation Builder A/文 · Flock Operations blue network · MK Business OS green glass.
- **Type:** Inter (800–900 for supers, 500 for sublines) and JetBrains Mono for tiny labels.
- **Mark:** the white outlined "MK" square plus "MK SUITE" from the UI.
- **Glows:** soft green or white bloom, never neon overload. Grade: deep blacks, a gentle vignette, very fine grain.

## Truth rules
- These are the reimagined launcher designs for the coming update, so the closing card says so ("The new MK Suite · coming in the next update").
- No prices or checkout. No invented numbers or user counts. Not "available now".
- No claims beyond what the screens and the product facts show. In particular:
  - Montage Pro has no automatic transcription, so never spotlight the "Transcribe" card text.
  - A phone never remotely controls the PC.
  - No real people's names, faces or voices.
- Use the UI's own words wherever possible, e.g.:
  - "Your tools. One place."
  - "Make room for your next idea."
  - "Find your next tool."
  - "Make it your suite."
  - "Your private desk."
  - "Create / Work / Grow"
- No "DEMO" badges.

## Structure and timeline
120 BPM; 1 beat = 30 frames; 1 bar = 120 frames.

| Act | Frames | Seconds | Builder |
|---|---|---|---|
| 0 Cold open | 0–600 | 0–10 s | A |
| 1 Reveal | 600–1440 | 10–24 s | A |
| 2 Create | 1440–2880 | 24–48 s | B |
| 3 Work | 2880–3840 | 48–64 s | C |
| 4 Grow | 3840–4800 | 64–80 s | C |
| 5 Make it yours | 4800–6000 | 80–100 s | D |
| 6 Finale | 6000–7200 | 100–120 s | D |

### 0 · Cold open: "You make a lot of things." (0–10 s)
- **Darkness:** product-art shards glint in deep space. These are small glass cards cropped from the screens' product artwork, at many depths, with bokeh. A super reads "You make a lot of things."
- **The rush:** the camera rushes forward through the cards. Each word lands as its card passes: "Voices." "Videos." "Packaging." "Music." Then faster: "Characters." "Automations." "Quotes." "Classrooms."
- **Assembly:** "One place for all of it." The cards decelerate and fly into the exact tile positions of the Explore screen (04). The screen materializes around them, a match-move assembly.

### 1 · Reveal: "The new MK Suite." (10–24 s)
- **Pull back:** Explore becomes a floating desktop window in dark space with a soft green rim light. Big super: "The new MK Suite."
- **Exploded view of the Studio library (01):** the screen separates into about 7 layers (backplate, sidebar, top bar, header, hero row, pinned row, "More" row). They spread in depth while the camera orbits about 30°, then slam back together on a hit. Super: "Redesigned from the ground up."
- **Layout switch:** a cursor clicks the Studio → Compact → Focus toggle. The screens morph 01 → 02 → 03, one per hit. Supers: "Studio." "Compact." "Focus." Then "Your library, your way."

### 2 · Create (24–48 s)
- **Chapter card:** the giant word "Create." with the UI's pen icon, and "Turn ideas into something real." It enters as a sweeping chapter transition.
- **Montage Pro Focus (03):** push in on the film-strip hero. A cursor hovers "Align cameras", then "Export an editing handoff". Super: "Bring your footage together."
- **MK Editor details (05):** the page slides in. The camera travels down across "Box and pouch artwork · Print checks · Approval handoff", and the check rows glow in sequence. Super: "From packaging artwork to production."
- **Ctrl+K:** two big 3D keycaps press Ctrl and K on the beat. The search overlay (16) drops in, "voice" types live, character by character, and MK Voice highlights. Super: "Everything, one keystroke away."
- **Pinned tiles from 01:** a fast, elegant run (MK Voice, MK Tones, CharForge Studio). Each grows to a hero crop with a name and one line: "Your voice workspace." "Melody sketches." "Character variants."

### 3 · Work (48–64 s)
- **Chapter card:** "Work." with "Tools that fit your workflow."
- **Compact library (02):** the Work filter chip is clicked. Work rows stay lit and the others dim: MacroForge "Desktop automation", Reclaim "Storage", Cake Studio "Cake designs". Super: "Automate the desk work."
- **Secret Office (14):** the camera glides across the MK Business OS hero and the office tools list. Super: "Your private desk."
- **Activity (07):** the timeline rows cascade in, and the "Check before retrying" panel lifts forward. Super: "Know what happened. And what's next."

### 4 · Grow (64–80 s)
- **Chapter card:** "Grow." with "Go further with the MK ecosystem."
- **Explore (04):** focus on MK Educate, Quotation Builder and Flock Operations, plus Job Engine / Orbit and MK Marketplace from 01's More row.
- **MK Educate web destination (06):** its phone card glows.
- **Phone concepts (22, 23, 24):** they rise in a 3D fan beside the desktop window. Super: "On your desk. And on your phone."

### 5 · Make it yours (80–100 s), the monetization moment
- **Membership (08):** the cursor clicks "Build a bundle". Checkmarks tick MK Voice, MK Editor and Montage Pro on beats, and the "Creator bundle · 3 apps" panel pulses. Supers: "Make it your suite." then "One app. A bundle. Or everything."
- **Review your selection (09):** the dialog scales in. Highlight the three apps and their terms. Show no prices.
- **Settings (11) → Light theme (31):** a circular reveal from the theme control. Super: "Dark. Light. Yours."
- **Guide (12):** "Answers, built in."

### 6 · Finale (100–120 s)
- **Welcome screen (13):** "Make room for your next idea." The camera drifts into the floating product cubes with a parallax layer split and a light sweep.
- **Website entry (21):** "Your tools. One place." The Create, Work and Grow columns light on three hits.
- **End card:** the MK SUITE mark locks with a green bloom. "Your tools. One place." · "Create · Work · Grow" · "The new MK Suite · coming in the next update". A slow fade to black on the final chord.

## Motion rules
- **Camera:** one cinematic camera language throughout: slow, confident dolly and orbit moves with ease-in and ease-out, and fast moves only on transitions, with motion blur.
- **Interactions:** springs with a slight overshoot.
- **Screens:** always shown as windows, with rounded corners (16 px at 1×), a 1 px `#2A2A2A` border, a deep shadow and a faint green rim. Never shown flat to the edges, except during deliberate push-ins.
- **Supers:** Inter 800/900 in white, set big but never covering the UI being shown. Each enters word by word with a spring, a slight upward drift and a blur-in. Supers leave the safe area clean. There are never two supers at once.
- **Magnification:** never more than about 1.6× source pixels (soft images look cheap). Hide close-ups behind motion where needed.
- **Determinism:** everything is frame-driven with seeded randomness only.

## Music (one coherent original track, 120 BPM)
- **Style:** a modern, premium launch film: warm, confident, uplifting electronic in a Spotify brand-film feel. Built on a 5-note bright pluck hook, warm Rhodes and pad chords (Cmaj7 → Am7 → Fmaj7 → G6), punchy but clean drums, sub bass, risers into chapter cards, and an impact on each chapter title.
- **Arc by act:**
  - **Cold open:** a low pulse and heartbeat kick, with a pluck or whoosh as each word card passes.
  - **Reveal (f600):** the full drop.
  - **Create:** bright and playful.
  - **Work:** tighter and percussive.
  - **Grow:** expansive arps.
  - **Make it yours:** a build.
  - **Finale:** the full hook, then the final held chord.
- **UI sound design:** every act EVENT gets a sound on its exact frame: cursor clicks, key thocks, check ticks, typing, whooshes, hits and impacts.
- **Master:** about -14 LUFS, true peak below -1 dBTP. Onset check within ±1 frame.

