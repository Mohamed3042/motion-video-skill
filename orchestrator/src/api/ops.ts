// The ONE operations table. MCP tools, HTTP `POST /api/<op>` and `mvo call <op>` all go through `callOp`,
// so every driver (any AI, any script, a human) gets identical behaviour. Descriptions are written for any model.
import {z} from 'zod';
import {validateRoles} from '../config.ts';
import {estimateRun} from '../budget.ts';
import type {Config, Orchestrator, Run} from '../types.ts';

export type Op = {
  name: string;
  description: string;
  input: z.ZodObject<any>;
  handler: (orch: Orchestrator, input: any) => Promise<unknown>;
};

const runId = z.string().min(1).describe('Run id, as returned by plan_video or list_runs.');
const jobId = z.string().min(1).describe('Job id, from claim_job or run_status (run.jobs[].id).');
const role = (what: string) =>
  z.string().min(1).optional().describe(`${what}. "<connection>/<model>" (e.g. "deepseek/deepseek-flash") or "host".`);

// run_status is polled a lot by agents: drop the bulky parts (full config snapshot, job prompts).
function slimRun(run: Run) {
  const {config, jobs, ...rest} = run;
  return {
    ...rest,
    budgetUSD: config.budgetUSD,
    preset: config.preset,
    roles: config.roles,
    jobs: jobs.map(({prompt, ...j}) => ({...j, promptChars: prompt.length})),
  };
}

// Config plus what still has to be fixed (missing keys, placeholder models, unknown prices), for agents and the UI.
const withProblems = (config: Config) => ({...config, problems: validateRoles(config)});

// Rough segment count before a plan exists (one world per 6-9 s). The real plan decides; this only feeds estimates.
export const segmentsFor = (seconds: number) => Math.max(1, Math.round(seconds / 8));

export const OPS: Op[] = [
  {
    name: 'plan_video',
    description:
      'Start a new video. Give the idea and the length in seconds (always required). The director role writes a Plan ' +
      '(title, format, brand, bar-aligned segments with picture and music briefs) unless you pass your own `plan` object. ' +
      'If the director role is "host" (= you) and you pass no plan, the call fails and its error message is the ' +
      "director's task: write the Plan JSON it describes and call plan_video again with {idea, seconds, plan}. Nothing is " +
      'built yet; the run waits in status "awaiting-approval". Returns the Run {id, status, plan, estimate, ...}. Next: ' +
      'show the plan and estimate to the user; when they agree, call approve {what:"plan"}, which starts the build.',
    input: z.object({
      idea: z.string().min(1).describe('What the video is about, in plain words (product, message, style, audience).'),
      seconds: z.number().positive().describe('Video length in seconds. Required: ask the user if you do not know it.'),
      format: z.enum(['16:9', '9:16', '1:1']).optional().describe('Aspect ratio. Default 16:9.'),
      brandNotes: z.string().optional().describe('Brand name, colors, fonts, tagline, and the facts allowed on screen.'),
      plan: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
          'Optional complete Plan written by you: {slug, title, seconds, fps (60|30), format, width, height, bpm, ' +
            'brand {name, colors, fonts {display}, facts[]}, intro {endFrame, brief, music}, outro {startFrame, brief, music}, ' +
            'segments [{id, name, startFrame, endFrame, accent, brief, music, copy[], entrance, exit}], truthRules[]}. ' +
            'Invalid plans are rejected with the exact errors.',
        ),
    }),
    handler: (o, i) => o.plan(i),
  },
  {
    name: 'estimate_cost',
    description:
      'Cost and time estimate with the current role assignments. Pass runId for a planned run (exact segment count), ' +
      'or only `seconds` for a rough estimate before any plan exists. Returns {roles: [{role, assignee, jobs, inTokens, ' +
      'outTokens, costUSD, minutes}], totalUSD, totalMinutes, withinBudget, notes}. costUSD null means the price is ' +
      'unknown (set it with set_roles.models). Free-tier and host roles cost $0. Call after plan_video or after ' +
      'changing roles.',
    input: z.object({
      runId: runId.optional(),
      seconds: z.number().positive().optional().describe('Video length, for a rough estimate when there is no run yet.'),
    }),
    handler: async (o, i) => {
      if (i.runId) return o.estimate(i.runId);
      if (i.seconds) return estimateRun(await o.getConfig(), segmentsFor(i.seconds));
      throw new OpError(400, 'Invalid input for estimate_cost: pass runId (planned run) or seconds (rough estimate).');
    },
  },
  {
    name: 'get_config',
    description:
      'Read the configuration: who does what (roles), connections (API endpoints, free tiers, the "host" connection), ' +
      'known models with prices, budgetUSD and gate settings, plus `problems`: what to fix before a run can work ' +
      '(a role without a model, a missing API key env var, an unknown price). Call this first to see the setup.',
    input: z.object({}),
    handler: async (o) => withProblems(await o.getConfig()),
  },
  {
    name: 'set_roles',
    description:
      'Change who does what, and the budget. Roles: director (writes the plan, final review), builder (builds segments, ' +
      '~85% of tokens), reviewer (scores stills, needs a vision model), escalation (retakes jobs that keep failing). Each ' +
      'role is "<connection>/<model>" (e.g. "deepseek/deepseek-flash", "gemini-free/gemini-3.6-flash") or "host", which ' +
      'means YOU, the agent calling these tools, do those jobs via claim_job/submit_job at no extra cost. `preset` applies ' +
      'a bundle first (free, economy, balanced, premium); explicit roles override it. `models` adds price info for models ' +
      'whose price is unknown. With `runId`, the change applies to that not-yet-started run instead of the saved defaults. ' +
      'Returns the updated Config with `problems` (see get_config).',
    input: z.object({
      runId: runId.optional(),
      preset: z.enum(['free', 'economy', 'balanced', 'premium']).optional(),
      roles: z
        .object({
          director: role('Writes the plan and does the final review'),
          builder: role('Builds each segment and the framework'),
          reviewer: role('Scores stills; should be a vision model'),
          escalation: role('Retakes jobs that failed their gates too often'),
        })
        .optional(),
      budgetUSD: z.number().min(0).optional().describe('Hard spending cap in USD; the run pauses when it is reached.'),
      models: z
        .array(
          z.object({
            ref: z.string().min(1).describe('"<connection>/<model>"'),
            price: z
              .object({inPerM: z.number().min(0), outPerM: z.number().min(0), cachedInPerM: z.number().min(0).optional()})
              .optional()
              .describe('USD per 1M input/output tokens.'),
            vision: z.boolean().optional().describe('Can it look at images?'),
            note: z.string().optional(),
          }),
        )
        .optional(),
    }),
    handler: async (o, i) => withProblems(await o.setRoles(i)),
  },
  {
    name: 'list_models',
    description:
      'List the model ids available on one connection (from the provider\'s /models endpoint), e.g. "deepseek", ' +
      '"gemini-free", "openai", "openrouter", "ollama". Combine as "<connection>/<model>" for set_roles. Fails with a ' +
      "clear message when the connection's API key environment variable is not set.",
    input: z.object({connection: z.string().min(1).describe('Connection id from get_config().connections.')}),
    handler: (o, i) => o.listModels(i.connection),
  },
  {
    name: 'start_run',
    description:
      'Start building a planned run (status "awaiting-approval"); same effect as approve {what:"plan"}. Jobs are created ' +
      '(one framework job plus one per segment) and run in parallel by their roles: API roles work on their own, "host" ' +
      'jobs wait for you to claim_job. Fails with the reason if the role setup has problems (see get_config) or the ' +
      'estimate exceeds budgetUSD (raise it with set_roles, or approve {what:"budget"} to start anyway). Paid roles ' +
      'spend up to budgetUSD, then the run pauses (status "paused-budget"). The run executes inside the process that ' +
      'serves these tools. Returns the Run; follow progress with run_status.',
    input: z.object({runId}),
    handler: (o, i) => o.start(i.runId),
  },
  {
    name: 'run_status',
    description:
      'Current state of a run: status (planning, awaiting-approval, scaffolding, building, integrating, rendering, done, ' +
      'paused-budget, failed, cancelled), spentUSD vs budgetUSD, roles, and every job (kind, segmentId, assignee, status, ' +
      'attempt, gates [{gate, ok, details}], stills, usage, log). `output` is the final MP4 path when done. Job prompts ' +
      'are left out (claim_job returns them). Poll every 10-30 s while a run is building.',
    input: z.object({runId}),
    handler: async (o, i) => slimRun(await o.status(i.runId)),
  },
  {
    name: 'list_runs',
    description: 'List all runs: id, idea, status, createdAt, spentUSD, output. Use it to find a runId.',
    input: z.object({}),
    handler: (o) => o.listRuns(),
  },
  {
    name: 'claim_job',
    description:
      'Host-worker protocol: lets YOU (the calling agent, or one of your subagents) do a job assigned to "host", at no ' +
      'API cost. Returns the next job waiting for a host worker in this run, now claimed by `worker`, or null when none ' +
      'is waiting (poll again in ~15 s while the run is building; when run_status shows no "waiting-host" jobs and the ' +
      'run is past "building", you are done). The loop:\n' +
      '1. claim_job {runId, worker: "<your name, e.g. subagent-2>"}.\n' +
      '2. Read job.prompt (Markdown): the complete task for this job.\n' +
      '3. Edit ONLY files matching job.allow (globs relative to the studio folder, the Remotion project). Anything else ' +
      'you change is reverted and fails the "ownership" gate. No Math.random, Date or performance.now ("determinism").\n' +
      '4. submit_job {jobId}: the orchestrator runs the gates (ownership, typecheck, determinism, stills, sound), then review.\n' +
      '5. Read the returned job.gates: each gate with ok:false has `details` with the exact failure. Fix it and ' +
      'submit_job again. Use get_stills to look at the rendered frames.\n' +
      '6. When job.status is "accepted", claim the next job.\n' +
      'Several workers can run in parallel (e.g. one subagent per job), each with its own worker name.',
    input: z.object({
      runId,
      worker: z.string().min(1).describe('Your worker name, unique per parallel worker (e.g. "codex-1", "subagent-3").'),
    }),
    handler: (o, i) => o.claimJob(i),
  },
  {
    name: 'submit_job',
    description:
      'Hand in a claimed job after editing its files. Runs the deterministic gates (ownership, typecheck, determinism, ' +
      'stills, sound) and then the reviewer. Returns the updated Job: status "accepted" when everything passed; ' +
      'otherwise read the gates with ok:false and their `details` (the exact errors), fix, and call submit_job again. ' +
      'After too many failures the job moves to the escalation role.',
    input: z.object({jobId, note: z.string().optional().describe('Optional note for the reviewer about what you did.')}),
    handler: (o, i) => o.submitJob(i),
  },
  {
    name: 'run_gates',
    description:
      "Dry run: run the deterministic gates on a job's current files without submitting or changing its status. Use it " +
      'to check your work before submit_job. Returns [{gate, ok, details}].',
    input: z.object({jobId}),
    handler: (o, i) => o.runGates(i.jobId),
  },
  {
    name: 'get_stills',
    description:
      'Rendered still frames of a job, as absolute PNG paths. Over MCP the images are attached too, so a vision-capable ' +
      'model can look at them; over HTTP fetch each with GET /api/file?path=<path>. Check layout, legibility and the ' +
      '72 px safe margin. Returns {jobId, stills}.',
    input: z.object({jobId}),
    handler: async (o, i) => ({jobId: i.jobId, stills: await o.stills(i.jobId)}),
  },
  {
    name: 'approve',
    description:
      'Human-in-the-loop approvals. what="plan": accept the plan and estimate and START the build (same as start_run). ' +
      'what="budget": start a run whose estimate exceeds budgetUSD, or resume a run paused at its budget (status ' +
      '"paused-budget"; first raise the cap with set_roles {runId, budgetUSD}). what="final": the final check needs a ' +
      'human (run.error starts with "awaiting final approval"): look at the stills, then approve to render. Only call ' +
      'this when the user agreed, or told you to proceed on your own. Returns the Run.',
    input: z.object({runId, what: z.enum(['plan', 'budget', 'final'])}),
    handler: (o, i) => o.approve(i),
  },
  {
    name: 'cancel_run',
    description:
      'Stop a run: unfinished jobs are cancelled and no more money is spent. Accepted work stays. Returns the Run.',
    input: z.object({runId}),
    handler: (o, i) => o.cancel(i.runId),
  },
];

export class OpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getOp(name: string): Op {
  const op = OPS.find((o) => o.name === name);
  if (!op) throw new OpError(404, `Unknown operation "${name}". Available: ${OPS.map((o) => o.name).join(', ')}`);
  return op;
}

/** Validate `input` against the op's schema and run it. Throws OpError(400) with readable issues on bad input. */
export async function callOp(orch: Orchestrator, name: string, input: unknown): Promise<unknown> {
  const op = getOp(name);
  const parsed = op.input.safeParse(input ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(input)'}: ${i.message}`).join('; ');
    throw new OpError(400, `Invalid input for ${name}: ${issues}`);
  }
  return op.handler(orch, parsed.data);
}

/** Runs one op: in-process (`callOp` bound to an orchestrator) or over HTTP to a running `mvo serve`. */
export type Caller = (op: string, input: unknown) => Promise<unknown>;

export const localCaller = (orch: Orchestrator): Caller => (op, input) => callOp(orch, op, input);

/** Same ops over HTTP, so the CLI and `mvo mcp --url` can share one long-lived `mvo serve` process. */
export const remoteCaller = (baseUrl: string, token = process.env.MVO_TOKEN): Caller => async (op, input) => {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/${op}`, {
    method: 'POST',
    headers: {'content-type': 'application/json', ...(token ? {authorization: `Bearer ${token}`} : {})},
    body: JSON.stringify(input ?? {}),
  });
  const body = (await res.json().catch(() => ({error: `${res.status} ${res.statusText}`}))) as any;
  if (!res.ok) throw new OpError(res.status, body?.error ?? `${res.status} ${res.statusText}`);
  return body;
};

/** Self-description for discovery (GET /api/ops, `mvo ops`). */
export function describeOps() {
  return OPS.map((o) => ({name: o.name, description: o.description, input: z.toJSONSchema(o.input, {io: 'input'})}));
}
