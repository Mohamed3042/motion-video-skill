---
id: prompting_motion_design_opus
kind: note
created: 2026-10-03
updated: 2026-10-03
evidence: derived
status: active
---
**For code-rendered motion films, prompt quality comes from constraints and a scored critique loop, not from a longer description. The prompt states a render contract, a reference, a state list on a beat grid, named banned defaults and gates; the agent then scores its own frames as a harsh director until every axis is 8+.**
#resource #motion #prompting

## What to put in a motion prompt (short version)
- **Render contract:** each frame is a pure function of time (`seek(t)` or Remotion's `useCurrentFrame()`). No timers, no CSS transitions in render mode, no state carried between frames, seeded noise only. The user's `motion-video` skill already follows this.
- **A reference:** a frame or video. Extract one frame every 0.5 s and turn it into a style guide (palette, type, shot lengths, transitions, how text enters). Take the grammar, never the content.
- **A state list, not a vibe:** named states on a beat grid ("logo → button → typed field → loader → check …"), one per beat.
- **Banned defaults:** name them, for example a title centred on a gradient, everything fading in, corner labels, glow on UI chrome, particle bursts, bouncy easing. "Avoid the AI look" is too vague to act on.
- **Gates:** brief or shot list → stills → animatic → render. If the user is away, continue and note the assumptions.
- **Critique loop:** contact sheet, a strip around fast moves, a 360 px phone sheet, and a loop-seam check. Score seven axes: hook, readability, motion, variety, composition, brand accuracy, sound sync. Fix the 3 worst problems; at least 3 rounds; ship at 8+. Without the "harsh motion director, not a proud author" line, the model grades itself generously.
- **Lines to delete from older prompts:** "double-check", "think carefully", "verify with a subagent", "show your reasoning". On Opus 5.5 these add cost, not quality; effort level is the control instead (medium for fixes, higher for a new look).
- **Formats:** lay scenes out for 9:16, 1:1 and 16:9 from one timeline. Never crop 16:9 down to vertical.

## Applied
- 2026-10-03: the critique loop, banned defaults, reference step and gates are now in `skills/motion-video/SKILL.md` (§2, §6b).

## Sources
- The user shared a PDF on 2026-10-03, "Prompting Opus 5.5 – Anthropic Blueprint Applied to Motion Design". It is an independent synthesis citing Anthropic's Opus 5.5 prompting docs plus public posts. Its run times and character counts are reported, not measured.

## Links
- [[30_resources/design_resources_for_agents]]
- [[30_resources/open_slide]]
