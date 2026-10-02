# Job Orbit v2: "The Flight" (120 s)

**One sentence:** v1 was ten slides; v2 is one unbroken flight through the Orbit system, where every feature is a place you arrive at, every illusion is revealed by the camera rather than explained by a caption, and the product UI floats in real 3D as crisp glass holograms.

**Format:** composition `JobOrbit2` (`studio/src/orbit2/entry.tsx`). 120.0 s, 1920×1080, 60 fps, 7,200 frames. Same section frames, bar grid and validated score timing as v1 (`src/orbit2/timing.ts`). Every pixel and sound is code; the only bitmaps are Orbit's logo and the country outlines in `public/orbit2/`.

**Truth:** unchanged and mandatory. Read [`docs/job-orbit/PRODUCT-TRUTH.md`](../docs/job-orbit/PRODUCT-TRUTH.md) and the Truthfulness section of [`briefs/job-orbit.md`](job-orbit.md).
- Reuse v1's claim-reviewed copy (each section's `World2D.tsx`) verbatim wherever possible.
- Keep every "Sample data" chip and every limit line ("not a prediction of being hired", "Hypothetical", "not the whole market", "Applications require review and authorization", …).
- Use fictional people and employers only.
- New copy may only restate v1's claims more briefly.

## What must be better than v1

| v1 problem | v2 answer |
|---|---|
| Every world was the same flat navy slide: a title card, then an illusion diagram, then a centred UI card | Each world is a place in 3D with its own light, depth layers and set dressing. The camera arrives, moves through it and leaves. No two worlds share a layout. |
| Illusions explained by captions ("A and B are the same grey") | The **camera move itself reveals the truth**, and a 1–3 word caption at most confirms it after the eye has seen it |
| UI cards faded in flat at screen centre | UI panels are **glass holograms in 3D**: they swing in on springs, sit at different depths, catch accent edge light and parallax against the set. Focus moves between them. The camera pushes to a 1:1 distance when text must be read. |
| Static finale replaying cards | The camera pulls back to reveal the whole Orbit system, with ten stations lit along their orbits. A sweeping constellation recap, then the rings collapse into the planet. |
| Little sense of scale or story | One continuous journey from noise to one clear next step. The coral **satellite** (from the logo) is the guide: it leads the camera between stations and docks into the planet at the end. |

## The engine (read `src/orbit2/engine/*` before building)

- **Camera:** `engine/camera.ts` is one camera for the whole film.
  - Each section exports `shot(localFrame): Shot` from its `shot.ts`, in **local** coords: y up, and +z points away from the planet, so the planet glows behind your content.
  - Return sensible shots for `f ∈ [-24, length + 24]`; the engine flies between stations across that margin with an arc and an FOV punch.
  - Use `keyed(keys, f)` and `catmull(points, t)` from `engine/math.ts` for camera moves.
  - Moves must ease (anticipate, then glide); nothing starts or stops abruptly.
- **CSS 3D layer:** `engine/space.tsx`.
  - `Card3D` holds crisp HTML/SVG (UI, type, 2D illusion artwork) placed in 3D. `Group3D` nests them.
  - **Never** put opacity, filter or overflow on a `Group3D`. Fades go on a `Card3D` (`opacity`, `near`/`nearFade`, `far`, `dof`).
  - `useWorldFrame()` gives the local frame, and `useProject()` projects a local point to screen pixels for flat overlays.
  - Text is crispest when the camera is `oneToOne(fov)` units away from a front-facing card (1 unit = 1 px).
- **WebGL layer:** `engine/gl.tsx`.
  - An optional `GL.tsx` per section holds react-three-fiber JSX in the same local coords: real geometry, lighting, shadows, particles, glow.
  - `useGLFrame()` gives the local frame.
  - WebGL is always *behind* the CSS layer, so put UI in CSS and sets in WebGL.
- **Determinism:** everything comes from the frame. Use seeded `mulberry32` only; never `Math.random`, `Date` or r3f `useFrame` clocks.
- **Debugging:** debug one section through the real camera with composition `Orbit2Section --props '{"id":"<id>"}'` (local frame 0 = composition frame 12; `--gl=angle`).

## Art direction

- **Space:**
  - deep navy-black (#020617 → #040b36) with a faint cobalt nebula
  - three depth layers in every shot: foreground particles or dust drifting past the lens, the midground set and UI, the far planet and stars
  - light: coral key from the satellite side, cobalt fill, a cool rim
- **Glass holograms** (the UI look):
  - **Body:** a navy glass panel (#0c1c58 at 70–85% with a subtle top-left sheen gradient), 1 px #355287 border, a 12 px radius.
  - **Accent:** a 2 px accent edge light along one side, plus a faint inner glow.
  - **Shimmer:** a slow diagonal scanline shimmer of 3–6% that moves over time.
  - **Entrance:** panels spring in on Y-rotation plus a Z push (`spring()` damping 14–18), never a plain fade. Feature rows reveal in a stagger on the beat.
  - **Readability:** keep text ≥ 22 px at the 1:1 distance. Panels may tilt 6–14° in Y for depth, but turn square to camera when the text matters.
- **Type:** Space Grotesk 700 for world titles, set big and *in the scene*: a 3D title card that the camera passes or that sits on the set, not a flat overlay. Index "0N / 10" in JetBrains Mono. The HUD stays as in v1.
- **Accents:** each world's accent (see `brand.ts`) tints its light, edge light, particles and set, so worlds read as different places at a glance.
- **Motion vocabulary:**
  - springs for arrivals
  - expo-out for UI reveals
  - slow orbital drift for sets
  - a 6–14 px camera shake only on declared impacts
  - motion streaks only during hops

## Story and shots

The section frames are the same as v1. Keep each section's v1 sound EVENT frames, because the picture must hit them (they're in each section's `timing.ts`).

1. **Act 1 · The noise (0–12 s, chaos):** the camera is *inside* a tumbling 3D storm of job-hunt debris:
   - browser tabs, posting cards ("Posted 30+ days ago", "Is this still open?"), CV files ("CV_final_v7.docx")
   - question marks, at varied depths with dust

   The kinetic lines are giant 3D type that the camera flies *through* on each hit. At 9.5 s the storm compresses ahead of the camera into a dense cloud, and "The job hunt is noise." holds.
2. **Act 2 · The turn (12–22 s, turn):** a coral point ignites.
   - **The orbit forms:** gravity pulls the debris into ordered orbital rings around it, and the planet forms in WebGL: a glossy cobalt sphere, a silver ring and the coral satellite.
   - **The logo lands:** the real logo PNG cross-dissolves in at the lock, with "Job Engine Orbit" and "Your next chapter has coordinates."
   - **The benefits:** three benefit satellites lock into orbit on their beats.
   - **The drop:** the camera dives toward the satellite, and the **BOOM at 22.0 s** launches the first hop.
3. **Ten stations (8 s each).** The camera hops in, the world title appears *in the set*, and the illusion plays as a set piece, **revealed by a camera move**. Then 2–3 product beats as holograms, and an exit move into the hop.

   | # | Station | Set and camera reveal |
   |---|---|---|
   | 1 | Profile & resume (coral) | **Fraser spiral** as a deep 3D tunnel of twisted-cord rings. The camera flies down its axis, so it reads as a spiral, then banks 70° to the side so the rings are seen edge-on as separate concentric circles: "No spin. Just facts." Facts get confirmed on holo chips, confirmed lines fly as light into a 3D resume page, and the formats and matching switch follow. |
   | 2 | The globe (sky) | **Stereokinetic:** flat rotating circles on a disc read as a sphere. The camera tilts and the disc *becomes* a real lit 3D globe (WebGL) with the EG / KW / SA outlines from the geojson in glowing cyan. Holograms show the scope chips, the country dossier and the Plan → Mine → Verify → Build stepper. |
   | 3 | New findings (mint) | **Lilac chaser** as a ring of 12 lanterns floating around the station. The phantom green dot is seen (never drawn), then becomes real. Finding cards orbit as a 3D carousel, newest first, with their observed dates and status pills. |
   | 4 | Job focus (starlight) | **Ebbinghaus** with real spheres. The role sphere sits among giant noise spheres; as the camera moves they drift away and small calm spheres surround it, so the same sphere grows. The focus hologram follows. |
   | 5 | Your fit (amber) | **Adelson** as a real 3D checkerboard lit by a lamp, with a real cylinder casting a shadow. A–B tiles are tuned so their rendered greys match; the camera orbits until A and B line up side by side, the shadow-caster lifts, and they're visibly identical. Then the three fit rows and the exact colour rule. |
   | 6 | Next proof (rose) | **Ponzo** as glowing rails receding to the horizon (WebGL) with two identical step-bars. The camera flies down the rails until both bars are side by side at equal depth: "smaller than it looks." The hypothetical before/after hologram follows. |
   | 7 | My market (periwinkle) | **Zöllner** seen from above as hatched avenues of a data city. The camera tilts down to street level and the hatch shadows fall away, leaving parallel avenues lined with 3D bars for the country × capability matrix (cells as columns), plus the salary-evidence and what-changed holograms. |
   | 8 | Employers (lavender) | **Café wall** as a vast building façade. Rows look wedged; the camera dollies along the façade until the rows read straight, and windows open into employer dossier holograms with Watch toggles. |
   | 9 | Evidence & agents (electric) | **Barber pole** as a tall research spire whose stripes seem to climb. The camera rises past floors: planner, miner, verifier, synthesis. The evidence ledger holograms show a rejected claim struck through, then the connection policy chips. |
   | 10 | Yours, everywhere (teal) | **Phi:** a PC monolith and a phone on two islands with alternating beacons, read as one light jumping. The private link appears as a light bridge, then the English ⇄ العربية flip and the display modes. |
4. **Finale (102–120 s):**
   - **The reveal:** the camera pulls back and up from station 10 to reveal the whole system, with the planet at the centre and ten stations glowing along their orbits.
   - **The recap:** a fast constellation sweep revisits each station, one beat each (MONTAGE_BEATS).
   - **The lock:** the rings converge into the planet and lock at **6480** (boom, shockwave, coral glint).
   - **The end card:** as v1's copy, placed in 3D with the logo; the camera eases in.
   - **The fade:** to navy at 7080.

## Sound

v1's score is validated: 65 events, −14 LUFS. Keep it and hit its frames. A builder may change a section's sound only together with its EVENTS (`scripts/orbit2/sections/<id>.ts` and `src/orbit2/sections/<id>/timing.ts`), testing with `scripts/orbit2/solo.ts`. The integrator re-runs `music.ts` and `check.ts` at the end.

## Acceptance (per section, before handing back)

- **Reveal:** the illusion is revealed by camera or 3D motion, not only by a caption.
- **Depth:** at least three depth layers in every shot.
- **Readability:** every hologram's text is readable at its hero moment (≥ 22 px apparent), inside the 72 px safe margin, and clear of the HUD bands (top 120 px, bottom 110 px).
- **Hops:** entrance and exit look good across [-24, 24] and [len−24, len+24].
- **Typecheck:** `npx tsc --noEmit` passes.
- **Stills:** at least 10 stills per world were looked at, including both hop margins.
