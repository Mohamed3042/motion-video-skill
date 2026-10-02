# Motion Orchestrator: design

This is software that runs the motion-video skill as a team of AI agents. **You decide who works on what**: which model plays which role, over which connection, and within what budget. A strict pipeline of contracts and automatic gates makes cheap or free models produce reliable results, with escalation to a stronger model only when a job keeps failing.

## Principle: vendor-neutral, both ways

- **Any AI can work in it.** Every role is just "a connection plus a model": OpenAI, Google Gemini (paid or free), DeepSeek, xAI Grok, Anthropic Claude, OpenRouter, a local Ollama or LM Studio, or whatever agent is driving it. Nothing is hard-wired to one vendor, and no single vendor is required.
- **Any AI can drive it.** The same operations are exposed three ways, and they behave identically:
  - an **MCP server** for Codex, Claude Code, Gemini CLI, Cursor, Claude Desktop or any MCP client
  - an **HTTP JSON API** for any agent, script or tool that can make web requests
  - the **CLI**
- **Model-agnostic prompts.** Prompts are plain Markdown with JSON outputs. There are no vendor-specific features (no proprietary tool formats or caching tricks), so a job prompt works the same on every model.

## Roles

| Role | Job | Token share | Typical pick |
|---|---|---|---|
| `director` | Writes the plan: brief, segment list and per-segment specs. Gives the final creative review. | ~5% | premium (OpenAI/Claude/Fable) or the MCP host |
| `builder` | Builds one segment (picture + sound) or the framework (intro, outro, transitions, HUD, master mix) | ~85% | cheap (DeepSeek V4.1 Flash) or the free Gemini tier |
| `reviewer` | Scores each segment's stills against a rubric and returns a JSON verdict | ~8% | cheap vision model (Gemini Flash free, DeepSeek Flash) |
| `escalation` | Retakes a job that failed its gates `retries` times | ~2% | stronger model (DeepSeek V4 Pro, premium) |

## Connections (any role, any connection)

| Connection kind | Example | Cost |
|---|---|---|
| `openai` | OpenAI-compatible API: OpenAI, DeepSeek, xAI Grok, Gemini, OpenRouter, Ollama, LM Studio | per token (price table) |
| `anthropic` | Anthropic-compatible API: Claude, DeepSeek `/anthropic` | per token |
| `openai` with `free: true` | Google Gemini API free tier | $0, rate-limited (`rpm`, `rpd`) |
| `mcp-host` | The agent connected over MCP (Claude Code, Codex, Gemini CLI, Claude Desktop) does the job with its own subscription and built-in subagents via `claim_job` / `submit_job` | $0 extra |

A role is written as `"<connection>/<model>"`, e.g. `"deepseek/deepseek-flash"`, `"gemini-free/gemini-3.6-flash"`, or `"host"`.

## Presets (the default is `balanced`)

| Preset | director | builder | reviewer | escalation |
|---|---|---|---|---|
| `free` | host | gemini-free | gemini-free | host |
| `economy` | deepseek-flash | deepseek-flash | gemini-free | deepseek-v4-pro |
| `balanced` | premium (user picks) or host | deepseek-flash | gemini-free | deepseek-v4-pro |
| `premium` | premium | premium | premium | premium |

## Pipeline (strict)

```
plan (director, LLM)  →  validate plan (schema)  →  scaffold (DETERMINISTIC codegen)
   →  jobs in parallel: framework + one per segment (builders, LLM)
        each job: build → gates → [fail: feedback + retry ≤ N → escalate] → review → accept (git commit)
   →  integrate (DETERMINISTIC: master music, onset check, tsc)  →  final review (director)  →  render  →  deliver
```

1. **The plan is data, not code.** The director returns JSON (`Plan`), validated by a schema: title, seconds, fps, format, brand tokens, and segments with exact frame bounds on a bar grid. A plan that's invalid is sent back with the errors.
2. **Scaffolding is codegen, never LLM.** The orchestrator writes the timing module, the segment registry, the composition registration, the solo/debug composition and the sound contract from the plan, using the `mkv` template. Models never touch these files.
3. **Ownership is enforced.** Each job has `allow` globs. After a job, every changed file outside them is reverted and the job fails the `ownership` gate.
4. **Gates are deterministic and run by the orchestrator, not the model:**
   - `ownership`
   - `typecheck` (`tsc --noEmit`)
   - `determinism` (bans Math.random, Date and performance.now in owned files)
   - `stills` (a fixed frame set renders; not black or empty; nothing in the 72 px safe margin)
   - `sound` (solo renders; peak < -1 dBFS; loudness within the target range; every EVENT onset within ±1 frame and ≥6 dB jump)
   - `review` (reviewer score ≥ threshold)
5. **Feedback loop:** the failing gate's exact output goes back to the same builder. After `retries` failures, the `escalation` role retakes the job from the last good commit.
6. **Git per job:** accepted job → commit. Rejected job → reset the owned paths. A broken job never pollutes another's work.
7. **Budget:**
   - **Before:** per-job token estimates × price table give the expected cost per role and the total. Free and host roles show $0, plus a time estimate from rate limits.
   - **During:** a ledger of real usage from API responses. Hitting `budgetUSD` pauses the run and asks.

## Interfaces

- **CLI** `mvo`: `init`, `plan "<idea>" --seconds 60 --format 16:9`, `estimate`, `run`, `status`, `dashboard`, `mcp`.
- **MCP server** (stdio):

  | Group | Tools |
  |---|---|
  | Planning | `plan_video`, `estimate_cost`, `set_roles` |
  | Running | `start_run`, `run_status` |
  | Host workers | `claim_job`, `submit_job` |
  | Gates and review | `run_gates`, `get_stills`, `approve` |
  | Control | `cancel_run` |

  A host agent can be the director (it calls `plan_video` with its own plan), a builder (`claim_job` → edit files → `submit_job` → gates run), or just the operator.
- **HTTP JSON API** (served by `mvo serve` / `mvo dashboard`, default `http://127.0.0.1:4317`): the same operations as the MCP tools, as `POST /api/<tool>` with a JSON body and a JSON response, plus `GET /api/events?run=<id>` (Server-Sent Events). It's local-only by default; set a bearer token (`MVO_TOKEN`) to expose it.
- **Dashboard** (local web app, `mvo dashboard`):
  - **Setup:** pick a connection and model per role, with model lists fetched from each provider's `/models`. Choose a preset, set the budget, and see a live cost and time estimate.
  - **Run:** a live job board (queued → building → gates → review → accepted / escalated / failed) with stills, gate logs and a spend meter, all via SSE.
  - **Outputs:** the finished videos.

## Layout

```
orchestrator/
  bin/mvo.ts            CLI entry
  src/types.ts          shared contracts (this design in code)
  src/config.ts         load + validate motion.config.json, presets, price table
  src/providers/        openai.ts, anthropic.ts, ratelimit.ts, cost.ts
  src/agent/            loop.ts (tool loop), tools.ts (sandboxed tools)
  src/pipeline/         plan.ts, scaffold.ts, jobs.ts, gates.ts, review.ts, integrate.ts, git.ts, budget.ts, store.ts, orchestrator.ts
  src/api/ops.ts        the operations table (name, zod input schema, handler), shared by MCP + HTTP + CLI
  src/mcp/server.ts     MCP server (registers every op as a tool)
  src/dashboard/        server.ts (HTTP API + SSE + static UI) + public/ (index.html, app.js, style.css, no build step)
  test/                 offline self-checks (mock providers, gates on fixtures)
```

Runtime: Node.js 22.18+ / 24 runs `.ts` directly (erasable syntax only: no enums, namespaces or parameter properties). Dependencies: `@modelcontextprotocol/sdk` and `zod`.
