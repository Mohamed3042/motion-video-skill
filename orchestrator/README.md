# Motion Orchestrator

Motion Orchestrator runs the [motion-video skill](../skills/motion-video/SKILL.md) as a **team of AI agents**. You decide which model does which job, over which connection, and within what budget. Strict contracts and automatic gates make cheap or free models produce reliable results, and a job that keeps failing escalates to a stronger model.

It's vendor-neutral both ways:
- **Any AI can work in it.** Every role is just a connection plus a model: OpenAI, Gemini (paid or free tier), DeepSeek, xAI Grok, Claude, OpenRouter, a local Ollama or LM Studio, or the agent that's driving it.
- **Any AI can drive it.** The same 14 operations are exposed as an **MCP server**, an **HTTP JSON API** and a **CLI**, and they behave identically. There's also a local web **dashboard** for humans.

Design notes: [DESIGN.md](DESIGN.md).

## Install

You need Node.js 22.18+ (it runs the TypeScript directly; there's no build step), plus the studio's own setup from the [main README](../README.md).

```bash
cd motion-video-skill/orchestrator
npm install
node bin/mvo.ts init        # writes motion.config.json at the repo root
node bin/mvo.ts dashboard   # opens http://127.0.0.1:4317
```

`npm link` (optional) puts `mvo` on your PATH. The examples below write `mvo` for `node bin/mvo.ts`.

API keys are read from environment variables (`DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY`). They're never written to the config file.

## Roles, connections and presets

| Role | Job | Share of tokens |
|---|---|---|
| `director` | Writes the plan (segments, briefs, music) and gives the final review | ~5% |
| `builder` | Builds each segment and the framework (intro, outro, transitions, mix) | ~85% |
| `reviewer` | Looks at each segment's stills and scores them; needs a vision model | ~8% |
| `escalation` | Retakes a job that failed its gates too many times | ~2% |

A role is written as `"<connection>/<model>"` (for example `deepseek/deepseek-flash` or `gemini-free/gemini-3.6-flash`), or as `"host"`.

| Connection | What it is | Cost |
|---|---|---|
| `openai`, `deepseek`, `xai`, `gemini`, `openrouter` | OpenAI-compatible APIs | per token |
| `anthropic` | Anthropic-compatible API | per token |
| `gemini-free` | Gemini API free tier | $0, rate-limited (`rpm`, `rpd`) |
| `ollama`, `lmstudio` | Local models | $0 |
| `host` | The AI agent connected over MCP or HTTP does the job itself, with its own subscription and subagents | $0 extra |

Add any other OpenAI-compatible endpoint as a new entry under `connections` in `motion.config.json`.

| Preset | director | builder | reviewer | escalation |
|---|---|---|---|---|
| `free` | host | gemini-free | gemini-free | host |
| `economy` | deepseek-flash | deepseek-flash | gemini-free | deepseek-v4-pro |
| `balanced` (default) | a premium model you pick | deepseek-flash | gemini-free | deepseek-v4-pro |
| `premium` | premium | premium | premium | premium |

Change roles in the dashboard's **Setup** tab, with `mvo roles --preset economy --director host`, or with the `set_roles` operation.

## Drive it from any AI

Each MCP client below gets the same tools: `plan_video`, `estimate_cost`, `get_config`, `set_roles`, `list_models`, `start_run`, `run_status`, `list_runs`, `claim_job`, `submit_job`, `run_gates`, `get_stills` (it also returns the images), `approve` and `cancel_run`.

In every snippet, replace `/path/to/motion-video-skill` with your clone's absolute path. On Windows, write it like `C:\\Users\\you\\motion-video-skill` inside JSON and TOML strings.

### Claude Code

```bash
claude mcp add --scope user motion -- node /path/to/motion-video-skill/orchestrator/bin/mvo.ts mcp
```

### OpenAI Codex (CLI, IDE extension, desktop app)

```bash
codex mcp add motion -- node /path/to/motion-video-skill/orchestrator/bin/mvo.ts mcp
```

Or edit `~/.codex/config.toml`. Codex only forwards the environment variables you list, and planning or gates can outlast its default 60 s tool timeout:

```toml
[mcp_servers.motion]
command = "node"
args = ["/path/to/motion-video-skill/orchestrator/bin/mvo.ts", "mcp"]
env_vars = ["DEEPSEEK_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY"]
tool_timeout_sec = 900
```

### Gemini CLI

```bash
gemini mcp add --scope user motion node /path/to/motion-video-skill/orchestrator/bin/mvo.ts mcp
```

Or edit `~/.gemini/settings.json`. Gemini CLI strips variables named like `*KEY*` from MCP servers unless you pass them explicitly in `env`:

```json
{
  "mcpServers": {
    "motion": {
      "command": "node",
      "args": ["/path/to/motion-video-skill/orchestrator/bin/mvo.ts", "mcp"],
      "env": {"GEMINI_API_KEY": "$GEMINI_API_KEY", "DEEPSEEK_API_KEY": "$DEEPSEEK_API_KEY"},
      "timeout": 900000
    }
  }
}
```

### Cursor, Claude Desktop and other MCP clients

These use the common `mcpServers` JSON. For Cursor, put it in `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project). For Claude Desktop, put it in `claude_desktop_config.json` (Settings → Developer → Edit Config).

```json
{
  "mcpServers": {
    "motion": {
      "command": "node",
      "args": ["/path/to/motion-video-skill/orchestrator/bin/mvo.ts", "mcp"],
      "env": {"DEEPSEEK_API_KEY": "sk-...", "GEMINI_API_KEY": "..."}
    }
  }
}
```

Desktop apps don't inherit your shell's environment, so put the keys in `env` (or use the client's `${env:NAME}` syntax where it has one).

### Sharing one live process (recommended with the dashboard)

Each `mvo mcp` normally runs its own orchestrator. To make the dashboard show an agent's runs live, start one server and point the MCP server at it:

```bash
mvo dashboard                                    # terminal 1: one long-lived process
claude mcp add --scope user motion -- node /path/to/motion-video-skill/orchestrator/bin/mvo.ts mcp --url http://127.0.0.1:4317
```

`--url` works the same in the Codex, Gemini CLI and JSON configs: add `"--url", "http://127.0.0.1:4317"` to `args`. The CLI accepts it too, or reads the `MVO_URL` environment variable.

### Any HTTP agent or script

`mvo serve` (or `mvo dashboard`) serves the API at `http://127.0.0.1:4317`. Every operation is `POST /api/<op>` with a JSON body and a JSON response.

```bash
# discover every operation, with its description and a JSON Schema for its input
curl -s http://127.0.0.1:4317/api/ops

curl -s -X POST http://127.0.0.1:4317/api/plan_video \
  -H 'content-type: application/json' \
  -d '{"idea": "a 30 second promo for my note app: instant capture, offline sync", "seconds": 30}'
# → {"id": "run_...", "status": "awaiting-approval", "plan": {...}, "estimate": {...}}

curl -s -X POST http://127.0.0.1:4317/api/approve   -d '{"runId": "run_...", "what": "plan"}'
curl -s -X POST http://127.0.0.1:4317/api/start_run -d '{"runId": "run_..."}'
curl -s -X POST http://127.0.0.1:4317/api/run_status -d '{"runId": "run_..."}'

# live events (Server-Sent Events)
curl -N "http://127.0.0.1:4317/api/events?run=run_..."

# stills and the final video (only from .motion/ and outputs/; supports Range)
curl -s "http://127.0.0.1:4317/api/file?path=<absolute path from get_stills or run.output>" -o still.png
```

Errors come back as `{"error": "..."}`: status 400 for invalid input (the message names each bad field), 404 for an unknown operation, 401 when a token is required, and 500 when an operation fails.

### CLI

```bash
mvo roles --preset economy --director host --budget 3
mvo models deepseek
mvo estimate --seconds 45                          # rough cost/time before planning
mvo plan "a 45 second feature tour for my app" --seconds 45 --format 16:9 --brand "Acme, #ff5a1f, Inter"
mvo approve run_xxx && mvo start run_xxx          # follows the run until it ends
mvo run "a 20 second logo reveal" --seconds 20     # plan, show the estimate, ask y/N, build, follow
mvo status [run_xxx]
mvo ops                                            # list operations
mvo call run_status '{"runId": "run_xxx"}'         # any operation; '-' reads the JSON from stdin
```

Exit codes: `0` ok, `1` the operation or run failed, `2` bad usage or invalid input, `3` the run paused at its budget.

## Host agent as builder: use your own subagents

Set any role to `host` and the agent that drives the orchestrator does that work itself. It uses its own subscription and can use its built-in subagents, with no API spend. Assign the builder role to host, then give your agent a prompt like this one:

> Use the motion tools. Plan a 30 second promo for <product> (plan_video), show me the plan and the estimate, and wait for my OK. Then approve and start it. While the run is building, keep claiming jobs with claim_job and hand each one to a subagent. Each subagent reads job.prompt, edits only the files in job.allow (inside the studio folder), then calls submit_job. If any gate fails, it fixes exactly what the gate's details say and submits again, until the job is accepted.

The protocol, which the `claim_job` tool description also explains to the model:

1. `claim_job {runId, worker}` returns the next job waiting for a host, or `null` (poll again in ~15 s).
2. Read `job.prompt`, the complete task.
3. Edit only files that match `job.allow`. Anything else is reverted and fails the `ownership` gate. `Math.random`, `Date` and `performance.now` fail the `determinism` gate.
4. `submit_job {jobId}` runs the gates (ownership, typecheck, determinism, stills, sound), then the review.
5. Every failed gate has `details` with the exact error. Fix it and submit again. `get_stills` shows the rendered frames, and `run_gates` checks the work without submitting.
6. Once the job is `accepted`, claim the next one. Several workers can run in parallel, each with its own `worker` name.

## Free mode

`mvo roles --preset free` sets the director and escalation roles to `host` and the builder and reviewer roles to the Gemini API free tier. With a free `GEMINI_API_KEY` and an agent subscription you already have, the run costs **$0**. The free tier is rate-limited, so the estimate shows the extra wall-clock time. Edit `rpm`/`rpd` on the `gemini-free` connection to match your tier. Local models (`ollama`, `lmstudio`) are $0 too.

## Budget

- **Before a run:** `plan_video` returns an estimate per role: jobs, tokens, dollars and minutes. Free and host roles show $0. If a model's price is unknown, its cost shows as `?` and the budget check can't run until you enter the price (dashboard price fields, or `set_roles {models: [{ref, price: {inPerM, outPerM}}]}`). Nothing is spent until you approve the plan.
- **During a run:** a ledger records real usage from every API response. When spending reaches `budgetUSD`, the run pauses with status `paused-budget`. It continues only after `approve {what: "budget"}` (the dashboard's "Continue past budget" button, or the y/N prompt in `mvo run`). To raise the cap first, use `set_roles {budgetUSD}`.
- Estimates assume no prompt-cache hits, so they're an upper bound.

## Operations

| Operation | Input | What it does |
|---|---|---|
| `get_config` | `{}` | Roles, connections, models and prices, budget, plus `problems` (what to fix first) |
| `set_roles` | `{runId?, preset?, roles?, budgetUSD?, models?}` | Change who does what, prices and budget |
| `list_models` | `{connection}` | Model ids on a connection |
| `plan_video` | `{idea, seconds, format?, brandNotes?, plan?}` | Plan and estimate; the run waits for approval. A host director passes its own `plan` |
| `estimate_cost` | `{runId}` or `{seconds}` | Exact estimate for a planned run, or a rough one before planning |
| `approve` | `{runId, what: plan \| budget \| final}` | Human-in-the-loop approvals |
| `start_run` | `{runId}` | Build an approved run |
| `run_status` | `{runId}` | Status, spend, every job with its gates, stills and log (prompts left out) |
| `list_runs` | `{}` | All runs |
| `claim_job` | `{runId, worker}` | Host worker: take the next job (`null` if none is waiting) |
| `submit_job` | `{jobId, note?}` | Host worker: hand in the job; runs the gates and the review |
| `run_gates` | `{jobId}` | Dry-run the gates |
| `get_stills` | `{jobId}` | A job's stills (images attached over MCP) |
| `cancel_run` | `{runId}` | Stop a run |

## Security

- The HTTP API listens on **127.0.0.1** only by default. It answers only requests addressed to a loopback host name (this blocks DNS rebinding) and refuses cross-origin browser requests (this blocks CSRF from websites you visit).
- To expose it on a network, set `MVO_TOKEN` to a long random secret. `mvo serve --host 0.0.0.0` refuses to start without one. Clients then send `Authorization: Bearer <token>`. The dashboard asks for the token once and keeps it in your browser.
- `/api/file` serves files only from `<repo>/.motion` and `<repo>/outputs`, after resolving symlinks. Any other path returns 403.
- API keys stay in environment variables and are never stored in `motion.config.json` or returned by any operation.
- Host workers can write only inside the studio: the ownership gate reverts changes outside `job.allow`. Still, review what an agent with file access does on your machine.

## Development

```bash
npm test                                    # every test/*.test.ts
npx tsc --noEmit
MVO_FAKE=1 node bin/mvo.ts dashboard        # the UI on an in-memory fake orchestrator (no AI, no money)
```

`MVO_FAKE=1` swaps in `test/fake-orchestrator.ts` for every command (`MVO_FAKE_TICK` sets the simulation speed in ms, `MVO_FAKE_DIR` sets where the fake stills go). `test/interfaces.test.ts` checks every operation over HTTP, MCP (stdio) and the CLI against it.
