# Using the motion-video skill with any AI agent

The skill is one file, [`skills/motion-video/SKILL.md`](../skills/motion-video/SKILL.md), in the open **Agent Skills** format (a folder with a `SKILL.md`: YAML front matter + Markdown instructions). Agents that support skills load it natively. Agents that don't can still read it through `AGENTS.md`, `GEMINI.md` or `CLAUDE.md`, which this repo provides. For API-only models there's a small runner, [`agent/run.mjs`](../agent/run.mjs).

**Every agent needs the same machine setup first:**

```bash
git clone https://github.com/Mohamed3042/motion-video-skill
cd motion-video-skill/studio
npm install
```

You also need Node.js 22+ and ffmpeg/ffprobe on your PATH. A GPU is optional; it speeds up the 3D template. On Windows, clone to a short path such as `C:\Users\you\Documents\motion-video-skill`.

Then open the **repo root** (not `studio/`) in your agent and ask for a video. For example:

> make a 30 second 16:9 promo for my app, here's the website: …
> make a 60 second feature tour where every feature is its own world

The agent asks for the length in seconds if you didn't give it. It then writes a brief, builds from the closest template, generates the music, checks still frames and renders into `outputs/`.

---

## Claude Code

- **In this repo:** it just works. `CLAUDE.md` points Claude at the skill.
- **Everywhere:** install it as a personal skill:
  ```bash
  mkdir -p ~/.claude/skills && cp -r skills/motion-video ~/.claude/skills/
  ```
  Then type `/motion-video` or just ask for a video. A global install still needs this repo on disk; the skill will ask where it is.
- **Claude Code running on DeepSeek** (cheap): DeepSeek serves an Anthropic-compatible API. Set two environment variables before starting `claude`, then work as usual:
  ```bash
  export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
  export ANTHROPIC_API_KEY=<your DeepSeek key>
  ```
  See DeepSeek's [Claude Code guide](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code).

## OpenAI Codex (CLI / IDE)

- **In this repo:** Codex reads `AGENTS.md` automatically, and that file points it to the skill.
- **As a native skill:** copy the folder to a skills location Codex scans. Then mention `$motion-video` or just describe the video.
  ```bash
  # this repo only
  mkdir -p .agents/skills && cp -r skills/motion-video .agents/skills/
  # all projects
  mkdir -p ~/.codex/skills && cp -r skills/motion-video ~/.codex/skills/
  ```

## Gemini CLI

- **In this repo:** `GEMINI.md` imports `AGENTS.md`, so Gemini CLI picks up the instructions on start.
- **As a native skill** (supported in current Gemini CLI):
  ```bash
  # this repo only
  mkdir -p .gemini/skills && cp -r skills/motion-video .gemini/skills/
  # all projects
  mkdir -p ~/.gemini/skills && cp -r skills/motion-video ~/.gemini/skills/
  ```

## Grok (xAI API)

Grok is available as an API, so use the bundled runner:

```bash
export XAI_API_KEY=...
node agent/run.mjs --provider xai "make a 20 second promo for ..."
```

The default model is `grok-4.7`; pass `--model` to change it. The endpoint is `https://api.x.ai/v1`.

## DeepSeek API (V4.1-Flash: cheap and strong)

```bash
export DEEPSEEK_API_KEY=...
node agent/run.mjs --provider deepseek "make a 45 second feature tour for ..."
```

- The default model is `deepseek-flash`, DeepSeek-V4.1-Flash (GA September 2026). It's very low cost, strong at coding, and has native image understanding, so it can look at the rendered stills.
- Use `--model deepseek-v4-pro` for DeepSeek's flagship.
- The endpoint is `https://api.deepseek.com`.
- Prefer working inside Claude Code? See "Claude Code running on DeepSeek" above.

## Gemini API (without the CLI)

```bash
export GEMINI_API_KEY=...
node agent/run.mjs --provider gemini "make a 15 second logo reveal for ..."
```

The default model is `gemini-3.6-flash`; pass `--model` for another. The endpoint is Google's OpenAI-compatible URL, `https://generativelanguage.googleapis.com/v1beta/openai/`.

## Any other OpenAI-compatible model

```bash
BASE_URL=https://your-endpoint/v1 API_KEY=... MODEL=your-model node agent/run.mjs "..."
```

This covers OpenRouter (`--provider openrouter --model <id>`), OpenAI (`--provider openai --model <id>`), local servers and gateways.

### What the runner does

`agent/run.mjs` is about 150 lines with no dependencies:
- **System prompt:** it loads `SKILL.md`.
- **Tools:** it gives the model four tools: `run_command`, `read_file`, `write_file` and `view_image`.
- **The loop:** it repeats until the model stops calling tools, then waits for your reply.

| Flag | What it does |
|---|---|
| (none) | Asks **before every command and file write**. |
| `--yes` | Lets the agent run unattended. Only use it on a machine and folder you're happy for it to change. |
| `--no-vision` | For models that can't read images. The agent then relies on ffprobe numbers and asks you to look at the stills. |

Commands run in PowerShell on Windows and bash elsewhere; override with `AGENT_SHELL`. `node agent/selftest.mjs` checks the loop offline against a fake API.

Model IDs and endpoints change. If a default stops working, check the provider's docs and pass `--model` / `BASE_URL`.

## Tips for any agent

- **Give the length up front:** "make a 40 second…" skips a question round.
- **Point at real material:** your website, README or design notes. The skill only shows features those sources confirm.
- **A good first video:** a 20–30 s product promo from the `mk` template.
- **Longer tours:** use the `mkv` "worlds" template. One world per feature, 6–9 s each.
- **The mix hasn't been heard:** agents can't listen to audio. They check loudness and hit timing by the numbers, so give the result a listen yourself.
