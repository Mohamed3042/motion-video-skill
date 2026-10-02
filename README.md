# motion-video-skill

**An AI-agent skill for making motion-graphics videos where every frame and every sound is code.**

You give an agent an idea, a length in seconds and your brand, and it hands back a finished 1080p60 MP4:
- the picture is drawn in [Remotion](https://www.remotion.dev) (React)
- the music is synthesized from scratch in Node
- every hit lands on its exact frame

The skill works with Claude Code, OpenAI Codex, Gemini CLI, and, through the bundled runner, the Grok, DeepSeek and Gemini APIs. See [`docs/USING-WITH-AGENTS.md`](docs/USING-WITH-AGENTS.md).

## Made with this skill

| | |
|---|---|
| [![MK Voice](outputs/mk-voice.jpg)](outputs/mk-voice.mp4) **[MK Voice](outputs/mk-voice.mp4)**: 20 s product reel | [![Montage Pro](outputs/mk-montage.jpg)](outputs/mk-montage.mp4) **[Montage Pro](outputs/mk-montage.mp4)**: 20 s product reel |
| [![MK Suite](outputs/mk-suite.jpg)](outputs/mk-suite.mp4) **[MK Suite](outputs/mk-suite.mp4)**: 20 s product-family reel | |

Every video above is 1920×1080 at 60 fps. Each has its own soundtrack generated in code, mastered to −14 LUFS, and hit-synced to ±1 frame. No stock footage, samples or After Effects were used.

## How it works

1. **Ask:** the agent asks how many **seconds** you want (always), plus the format, brand and style if they're missing.
2. **Brief:** it writes a scene-by-scene plan to `briefs/<slug>.md` (palette, fonts, scenes with exact second ranges, music cues, truthfulness rules).
3. **Template:** it copies the closest template in `studio/src/` instead of starting from zero.
4. **One timing file:** scene bounds and every sound event live in a single `.ts` module. Both the React scenes and the Node synth import it, which is why sound and picture can't drift.
5. **Music in code:** oscillators, FM, noise, reverb and a limiter → a WAV at −14 LUFS with true peak below −1 dBTP. An onset check fails the build if any impact is more than ±1 frame off.
6. **Look before rendering:** the agent renders stills of every scene, looks at them, fixes layout and legibility, then renders the MP4. It checks the result with ffprobe and makes a share copy.

## Templates

| Template | Use it for |
|---|---|
| [`studio/src/mk`](studio/src/mk) | Product and UI promos; several reels sharing one design system (cards, pills, waveforms, timelines, end cards) |
| [`studio/src/mkv`](studio/src/mkv) | Long feature tours where **every feature is its own world**, with its own color, optical illusion and music style. A framework provides portals between worlds, a per-world HUD, an intro, a finale montage and a master mix. |
| [`studio/src/opus`](studio/src/opus) | Glossy 3D: a refractive glass sphere, mirror floor, extruded 3D type, shape morphs, particles forming text, one continuous camera move, a seamless loop |

## Quick start

```bash
git clone https://github.com/Mohamed3042/motion-video-skill
cd motion-video-skill/studio
npm install
```

You need Node.js 22+ and ffmpeg/ffprobe on your PATH. Then open the repo root in your agent and say, for example: *"make a 30 second promo for my app"*.

Re-render an included video yourself:

```bash
cd studio
node scripts/mk/music.ts
npx remotion render src/index.ts MkVoice ../outputs/mk-voice.mp4
```

`node scripts/mk/music.ts` regenerates the music WAVs, which aren't stored in git.

## Repo layout

```
skills/motion-video/SKILL.md   the skill (Agent Skills format: works in Claude Code, Codex, Gemini CLI, …)
AGENTS.md · CLAUDE.md · GEMINI.md   auto-loaded agent instructions (all point to the skill)
agent/run.mjs                  runner for API-only models (DeepSeek, Grok, Gemini API, any OpenAI-compatible)
docs/USING-WITH-AGENTS.md      setup for each agent and provider
studio/                        Remotion project + templates + music/check/stills scripts
briefs/                        the briefs behind the included videos
outputs/                       rendered videos + contact sheets
```

## Notes

- **Remotion licence:** Remotion has its own licence. It's free for individuals and small teams; larger companies need a company licence. See [remotion.dev/license](https://www.remotion.dev/license).
- **Font licences:** fonts load from Google Fonts. `studio/public/opus/fonts/Nunito-Black.ttf` is under the SIL Open Font License.
- **Code licence:** the code is MIT-licensed (see [LICENSE](LICENSE)). The MK Suite and MK Voice names, brands and the videos in `outputs/` belong to their owner; they're included as examples and aren't licensed for reuse.
