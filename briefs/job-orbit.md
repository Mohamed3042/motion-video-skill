# Job Engine Orbit: "Your next chapter has coordinates" (120 s)

**Concept:** three acts.
1. **The chaos:** the job hunt is noise.
2. **The turn:** Job Engine Orbit pulls the noise into orbit, and the benefits lock in.
3. **BOOM:** ten feature worlds flex everything the product does. Each world has its own accent, its own optical illusion (which makes a point about honest job searching) and its own music style, all on Orbit's navy-and-cobalt identity and one 120 BPM grid.

Then a finale montage and the planet logo.

**Format:** 120.0 s, 1920×1080, 60 fps (7,200 frames), H.264 + AAC. Composition id `JobOrbit`. Every animation and every sound is made in code. The only bitmaps are Orbit's own logo and country outlines in `public/orbit/`.

## Brand (from the product's own source, `OrbitDesign.css` / `web/DESIGN.md`)

- **Colours:**

  | Role | Hex |
  |---|---|
  | bg | **#071253** (deep navy) |
  | panel | #0c1c58 |
  | panel-raised | #14265f |
  | line | #355287 |
  | ink | #f3f7ff |
  | muted | #aec5ef |
  | soft | #8ba9db |
  | primary action (cobalt) | **#122ac2** |
  | cobalt hover | #2345e0 |
  | **coral** (brand accent, active tab, satellite) | **#ff754d** |
  | sky/cyan | #89b7ff |
  | good | #74e1ba |
  | warning/amber | #ffca8a |
  | red | #ffa6b7 |

- **Type:**
  - **Space Grotesk**: display, UI, numbers.
  - **IBM Plex Sans Arabic**: Arabic text.
  - **JetBrains Mono**: HUD and tiny labels.
- **Logo:** `public/orbit/brand/orbit-512.png`, a glossy cobalt planet with a silver ring and a coral satellite on navy. In the UI it appears as a ring mark with a coral arc. Recreate the ring mark as inline SVG so it can animate. Use the PNG only as the hero lock-up, and never distort it.
- **Wordmark:** "Job Engine" with "Orbit" beneath in coral; footer "ORBIT · Career intelligence for a broader you."
- **Taglines from the product:**
  - "Your next chapter has coordinates."
  - "A clearer job search."
  - "One role. Clear evidence. A next step."
  - "Your career, in view."
- **UI fragments** are film illustrations of source-backed workflows, not captured shipped screens: navy sidebar with a coral active-tab marker, panels #0c1c58 with 1 px #355287 borders, 12 px panel radius, 7 px controls, cobalt primary buttons, text-bearing status pills, Space Grotesk. Sample data is clearly fictional (the real app uses "Synthetic QA Employer"-style data). Show a small "Sample data" chip on dense UI fragments. The separate 114-image redesign gallery is proposed design work and is not evidence of shipped UI; do not use it as such.

## Truthfulness (mandatory)

Only what the product's code and docs state.

**Real capabilities:**
- **Profile & resume:**
  - separate profiles for every person
  - build evidence or import documents (PDF/DOCX/TXT/MD/CSV/JSON)
  - Confirm / Exclude / Return to review
  - resume download (PDF · DOCX · TXT) built only from confirmed facts
  - a "Use for job matching" switch
- **Map:**
  - a 3D globe with research scope chips for Egypt · Kuwait · Saudi Arabia
  - a country dossier: Verified open roles · Eligible opportunities · Salary evidence · Source coverage
  - the Plan → Mine → Verify → Build stepper
  - the Opportunity explorer and Nearby (within · approximate · outside · location unknown · remote)
- **New findings:** saved observations from public employer pages and feeds, with captured time and publication-at-observation status; location groups Egypt / Kuwait / Saudi Arabia / Remote-other; literal confirmed-skill overlaps are shown. Records are ordered by observed time, not a skill score. "In employer feed when checked" does not establish that a vacancy is open now. The separate verified-opening rule used by Job focus requires a valid check within 24 hours; it is not a blanket New findings promise.
- **Job focus:** "Your next step", Jobs to review (filters All · Verified open · Saved), and "Review missing evidence → Start review".
- **Your fit** (job detail tabs Overview · Your fit · Description · History), with the colour rule exactly: **"Green = supported by your facts. Red = a confirmed mismatch. Amber = missing evidence, not a rejection."**
- **Next proof** ("What should I learn next?") with hypothetical before/after coverage: "Proof scenarios are hypothetical. They never add a skill to your confirmed profile."
- **My market:** country × capability matrix, capability demand, salary evidence, what changed, past research.
- **Employers:** source-linked employer dossiers, watch an employer, find unexpected opportunities.
- **Evidence & agents:**
  - an evidence ledger (publisher, capture time, VERIFIED_OBSERVATION vs REPORTED_UNVERIFIED)
  - research stages planner → miner → verifier → synthesis
  - rejected claims shown
  - AI and research connections: Free only · Capped paid · Connected chat · Local model
- **Yours, everywhere:**
  - local workspace storage on the PC, with optional external research/AI providers and optional encrypted cloud backups
  - a phone companion over a private link
  - English ⇄ العربية (RTL)
  - display modes Standard · Calm dark · Soft light; text size; reduce motion

**Never show or imply:**
- unrequested applications or messages. Research-only work does not authorize sending. The native app does support explicitly authorized employer routes, reviewed packages and optional rule-bound autopilot; do not say that Orbit can never apply. No real application is sent for this film.
- hiring probability or guarantees
- cover letters
- LinkedIn/Indeed automation (boards are import-only)
- ML training ("Adding data does not train a machine-learning model")
- whole-market totals (counts are of your saved research)
- job-location pins outside Egypt
- specific counts of sources, findings or jobs
- prices, "available now" or version numbers (say "Windows · Local preview")
- real people's names or faces; use abstract silhouettes and fictional sample data only

## Smoothness and finish (same bar as `briefs/mk-voice-worlds.md`)

- **Motion:**
  - everything comes from the frame number; seeded PRNG only
  - animate transform and opacity; use a few pre-blurred glows
  - `CameraMotionBlur` only on genuinely fast moves
  - smooth camera shake (a sum of sines, decaying over 20 frames) only on impacts
- **Transitions** between sections are 12-frame "portals": the outgoing world's motif becomes the doorway into the next (the chain is below). Nothing ever cuts hard.
- **HUD** (tinted with the current accent):
  - corner brackets at 72 px
  - top-left "JOB ENGINE ORBIT · TEN WORLDS"
  - top-right "0N — WORLD NAME"
  - bottom-left "● LOCAL" plus a timecode
  - bottom-right "EG · KW · SA"
  - a 13-segment progress bar: chaos, turn, 10 worlds, finale

  The HUD is hidden during the chaos act and appears at the turn.
- **Finish:** a soft grain tile (~4%), navy vignette and very faint scanlines.

## Timeline (60 fps; 1 beat = 30 f, 1 bar = 120 f; everything bar-aligned)

| Section | Frames | Seconds | Accent | Illusion | Music style |
|---|---|---|---|---|---|
| Act 1 · Chaos | 0–720 | 0–12 | dirty white / warning | none (noise) | dissonant ticking, notification pings, rising tension |
| Act 2 · Turn | 720–1320 | 12–22 | coral + cobalt | gravity well (orbit) | chaos resolves → G major; 3 benefit hits; **drop at 1320** |
| 1 Profile & resume | 1320–1800 | 22–30 | coral #ff754d | **Fraser spiral** | typewriter/printer rhythm + warm Rhodes |
| 2 The globe | 1800–2280 | 30–38 | sky #89b7ff | **Stereokinetic sphere** | cinematic orbital pads, arps, sub |
| 3 New findings | 2280–2760 | 38–46 | mint #74e1ba | **Lilac chaser** (illusory green dot) | bright marimba plucks, sparkle per find |
| 4 Job focus | 2760–3240 | 46–54 | starlight #f3f7ff | **Ebbinghaus** | minimal piano + heartbeat, the world goes quiet |
| 5 Your fit | 3240–3720 | 54–62 | amber #ffca8a | **Adelson checker-shadow** | funky bass + claps, green/red/amber hits |
| 6 Next proof | 3720–4200 | 62–70 | rose #ffa6b7 | **Ponzo** | uplifting stepwise build |
| 7 My market | 4200–4680 | 70–78 | periwinkle #6f8cff | **Zöllner** | deep house |
| 8 Employers | 4680–5160 | 78–86 | lavender #c9b6ff | **Café wall** | neo-soul chords, brushed drums |
| 9 Evidence & agents | 5160–5640 | 86–94 | electric #4d7cff | **Barber pole** (aperture) | driving techno arps |
| 10 Yours, everywhere | 5640–6120 | 94–102 | teal #5ee0e6 | **Phi phenomenon** (PC ↔ phone) | lo-fi chill + a maqam-flavoured pluck for العربية |
| Finale | 6120–7200 | 102–120 | all → coral/cobalt | ten rings collapse into the planet | full theme, boom at **6480**, resolve |

## Act 1 · Chaos (0–12 s)

- **f30, hook:** a hard hit. A notification ping cuts the black.
- **The storm:** a storm of job-hunt noise builds, all fictional and generic:
  - stacks of browser-tab chips
  - posting cards ("Posted 30+ days ago", "Is this still open?", "Closed")
  - resume files ("CV_final_v7.docx", "CV_final_FINAL.pdf")
  - question marks
  - floating kinetic lines, each landing on a beat:
    - "Another tab."
    - "Another listing."
    - "Still open?"
    - "Do I even qualify?"
    - "Which CV is the true one?"
    - "What should I learn next?"
- **Feel:** the camera jitters smoothly, never per-frame.
- **9.5–12 s, the line:** everything compresses into a dense, roaring cloud and the headline "**The job hunt is noise.**" (Space Grotesk 700) holds over it.
- **Sound:** a tense clock tick, dissonant notification pings panned around, a rising noise bed, and a hit on each kinetic line.

## Act 2 · The turn (12–22 s)

- **12.0 s:** a coral point ignites at the centre and the noise starts to fall into orbit around it. Cards and tabs spiral into ordered rings.
- **14.0 s:** the planet forms (cobalt sphere, silver ring, coral satellite). The real `orbit-512.png` resolves at the lock, with a glow and a ring shockwave. "**Job Engine Orbit**" with "**Your next chapter has coordinates.**"
- **Benefits** (each a satellite that locks into orbit on a downbeat, with a hit):
  - 16.5 s: "**Facts you confirm.**"
  - 18.0 s: "**Sources and check dates.**"
  - 19.5 s: "**A clearer next step.**"
- **21–22 s:** a riser and suck-out. The camera dives into the coral satellite.
- **22.0 s:** **BOOM** into world 1.

## The ten worlds (8 s each)

Every world opens with a title moment in its first ~1.5 s: index "0N / 10" in mono, the world name in Space Grotesk 700, and a one-line promise. It then plays its illusion, shows 2–3 feature beats as real-app-style UI fragments, and ends on an exit pose that becomes the next portal.

1. **PROFILE & RESUME** (coral): "Your story. Confirmed."
   - **Illusion:** the Fraser spiral. Twisted cords look like a spiral but are concentric circles; a highlight traces one circle to prove it. "**No spin. Just facts.**"
   - **Beats:**
     - a profile card ("Create blank profile", fields name / headline / target roles)
     - "Build your evidence" rows and "Import a document" (PDF · DOCX · TXT · MD · CSV · JSON)
     - evidence chips Confirm ✓ / Exclude / Return to review
     - confirmed lines fly into a resume page
     - "Download PDF · DOCX · TXT"
     - a "Use for job matching" switch flips on
   - **Exit:** the resume page curls into a sphere, the globe.
2. **THE GLOBE** (sky): "Your next chapter has coordinates."
   - **Illusion:** stereokinetic. Flat, off-centre circles rotating on a disc are perceived as a 3D sphere, then become a real shaded globe (drawn in code). Real outlines of Egypt, Kuwait and Saudi Arabia come from `public/orbit/geo/*.geojson`, in cyan line art.
   - **Beats:**
     - scope chips Egypt · Kuwait · Saudi Arabia light up
     - camera controls Fit · Tilt · Rotate · North
     - the country dossier panel (Verified open roles · Eligible opportunities · Salary evidence · Source coverage), with "Add to research scope"
     - the stepper Plan → Mine → Verify → Build
     - Nearby rings (within · approximate · outside · remote)
   - **Exit:** the globe zooms to a single glowing point.
3. **NEW FINDINGS** (mint): "Findings with source context."
   - **Illusion:** the lilac chaser. A ring of 12 soft rose discs vanishes one at a time; the eye sees a green disc circling, but it is never drawn. "**New findings appear where you look.**"
   - **Beats:**
     - source pills from public employer and ATS feeds (Employer pages · RSS · ATS boards)
     - finding cards slide in ("In employer feed when checked" or "Page visible · opening unverified", plus a sample observed date; any 24-hour check must belong to an explicitly eligible sample opening)
     - location tabs Egypt · Kuwait · Saudi Arabia · Remote
     - confirmed-skill overlaps shown; newest observed records first
   - **Exit:** the illusory green dot becomes real and centres.
4. **JOB FOCUS** (starlight): "One role. Clear evidence. A next step."
   - **Illusion:** Ebbinghaus. The same circle looks small inside big noise circles and big inside small calm ones. Orbit removes the noise and the role grows.
   - **Beats:**
     - "Your next step" header
     - filters All · Verified open · Saved
     - the "Jobs to review" list ("Ordered for review — not a prediction of being hired", in small type)
     - "Review missing evidence → Start review" press
   - **Exit:** the central circle squares off into a checker tile.
5. **YOUR FIT** (amber): "Honest fit."
   - **Illusion:** Adelson's checker-shadow. Tiles A and B look different but are the same grey; a bridge bar proves it. "**Context changes how things look. Orbit tells you what they are.**"
   - **Beats:**
     - job detail tabs Overview · Your fit · Description · History
     - three requirement rows lighting Green / Red / Amber
     - the exact colour rule sentence
     - an amber row labelled "Needs evidence", with "not a rejection" emphasised
   - **Exit:** the checker floor tilts into converging rails.
6. **NEXT PROOF** (rose): "What should I learn next?"
   - **Illusion:** Ponzo. Two identical step-bars on converging rails; the farther one looks bigger. "**Your next step is smaller than it looks.**"
   - **Beats:**
     - a before → after coverage bar for a hypothetical documented skill, with the "Hypothetical" pill
     - "Proof scenarios never add a skill for you."
     - "Most common skill gaps" chips
   - **Exit:** the rails become matrix grid lines.
7. **MY MARKET** (periwinkle): "See the market you're in."
   - **Illusion:** Zöllner. Long parallel lines crossed by short hatches look tilted; the hatches fade and the lines are perfectly parallel. "**Straight comparisons.**"
   - **Beats:**
     - country × capability matrix (EG · KW · SA × capability rows; cells fill)
     - capability demand bars
     - a "Salary evidence" card
     - "What changed" ticks
     - "Counts of your saved research — not the whole market" (small)
   - **Exit:** the lines turn into café-wall rows.
8. **EMPLOYERS** (lavender): "Inspect employers through their sources."
   - **Illusion:** the café wall. Rows of offset tiles look wedged, but every row is perfectly straight. "**Every employer, lined up with its sources.**"
   - **Beats:**
     - employer dossier cards ("Needs come from accepted public observations")
     - a "Watch employer" toggle
     - "Find unexpected opportunities" sparkle
   - **Exit:** the rows shear into diagonal stripes.
9. **EVIDENCE & AGENTS** (electric blue): "Trace claims to sources and dates."
   - **Illusion:** the barber pole (aperture problem). Diagonal stripes that move sideways are seen as moving up the pole.
   - **Beats:**
     - research stages planner → miner → verifier → synthesis light in sequence
     - evidence ledger rows (publisher · captured · status pill VERIFIED / REPORTED)
     - a rejected claim gets struck through
     - AI connection chips: Free only · Capped paid · Connected chat · Local model
   - **Exit:** the pole collapses into two dots.
10. **YOURS, EVERYWHERE** (teal): "Private by design."
    - **Illusion:** the phi phenomenon. Two dots flashing alternately (PC and phone) are seen as one dot jumping between them.
    - **Beats:**
      - "Local workspace. Optional external providers." (local-first; selected remote AI/search may receive text, and optional encrypted cloud backup is supported)
      - phone companion over a private link (phone frame mirroring a card)
      - "Separate profiles for every person"
      - English ⇄ العربية flip (RTL, IBM Plex Sans Arabic)
      - Display: Standard · Calm dark · Soft light
    - **Exit:** the dots multiply into ten orbit rings.

## Finale (102–120 s)

- **102–107 s, montage:** one beat (30 f) per world, each world's HERO_FRAME with its name flashing in its accent.
- **107–108 s:** the ten rings converge into the planet.
- **108.0 s (f6480), logo lock:** big boom, shockwave and coral glint on the satellite.
- **End card:**
  - "**Job Engine Orbit**"
  - "Career intelligence for a broader you." (serif-less, Space Grotesk 500)
  - a chip "WINDOWS · LOCAL PREVIEW"
  - a small line: "Research with evidence. Applications require review and authorization."
- **118–120 s:** fade to navy.

## Music (one continuous 120 s track at 120 BPM, E minor ↔ G major)

- **Chaos:** atonal ticking and pings over a building noise bed. Hits land on each kinetic line.
- **Turn:** gravity whoosh, then the resolve chord. A hit on each benefit lock, then a riser and suck-out into the **drop at f1320**.
- **Worlds:** each world owns its sound design within its range, and its bar-1 downbeat sits exactly on the world's first frame.
- **Boundaries:** a whoosh peaking on each boundary frame, plus a short impact.
- **Finale:** all motifs layered, a boom plus shimmer at f6480, and a held resolve.
- **Master:** about **-14 LUFS** integrated, true peak below **-1 dBTP**. Worlds are loudness-matched within ±1.5 LU. Every impact or hit has a clear transient: cut or duck the bed ~60 ms before each one so the onset check (≥6 dB jump, within ±1 frame) passes.
