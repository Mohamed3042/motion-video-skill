# AGENTS.md

This repo makes motion-graphics videos entirely in code: Remotion (React) for every frame and a Node synth for every sound.

**To make a video:** read [`skills/motion-video/SKILL.md`](skills/motion-video/SKILL.md) in full, then follow it exactly. It covers:
- asking for the length in seconds
- writing the brief
- copying the closest template
- the timing, music and check rules
- rendering

## Layout

- `skills/motion-video/SKILL.md`: the skill (Agent Skills format).
- `studio/`: the Remotion 4 project. Templates are in `studio/src/{mk,mkv,opus}`, with music and check scripts in `studio/scripts/{mk,mkv,opus}`.
- `briefs/`: one brief per video, written before any code.
- `outputs/`: finished renders.
- `agent/run.mjs`: the runner for API-only models (see `docs/USING-WITH-AGENTS.md`).

## Setup and checks

- **Setup:** Node.js 22+ and ffmpeg on PATH, then `cd studio && npm install`.
- **Typecheck:** `cd studio && npx tsc --noEmit`.
- **Music:** `node scripts/<template>/music.ts` writes the WAV and checks loudness.
- **MK Voice Worlds sync check:** `node scripts/mkv/check.ts` checks that hits land on their frames.
- **Render:** `npx remotion render src/index.ts <CompositionId> ../outputs/<name>.mp4`.

## Hard rules

- Never use `Math.random` or `Date` in scenes. Everything comes from the frame number.
- Never invent product features, stats, prices or testimonials, and never use real people's names, faces or voices.
- Keep `setColorSpace('bt709')` in `studio/remotion.config.ts`.
