// Motion Orchestrator — shared contracts (see ../DESIGN.md). Erasable TypeScript only (Node runs it directly).
// Vendor-neutral: nothing here names or requires a specific AI vendor.

// ── Roles & connections ────────────────────────────────────────────────────────────────────────
export type RoleId = 'director' | 'builder' | 'reviewer' | 'escalation';
export const ROLES: RoleId[] = ['director', 'builder', 'reviewer', 'escalation'];

export type ConnectionKind = 'openai' | 'anthropic' | 'mcp-host';
export type Connection = {
  id: string; // e.g. "deepseek", "gemini-free", "openai", "host"
  kind: ConnectionKind;
  baseUrl?: string; // API kinds only
  keyEnv?: string; // name of the env var holding the API key (keys are never stored in config)
  free?: boolean; // free tier → costs $0 (still rate-limited)
  rpm?: number; // requests per minute
  rpd?: number; // requests per day
  tpm?: number; // tokens per minute
  headers?: Record<string, string>;
  note?: string; // shown in the dashboard, e.g. "rpm/rpd: edit to match your tier"
};

export type Price = {inPerM: number; outPerM: number; cachedInPerM?: number}; // USD per 1M tokens
export type ModelInfo = {
  ref: string; // "<connection>/<model>"
  price?: Price; // omitted → unknown (estimate shows "?" until the user enters it); free connections → $0
  vision?: boolean; // can look at stills
  note?: string;
};

// "<connection>/<model>" (e.g. "deepseek/deepseek-flash") or "host" (the MCP-connected agent does it)
export type RoleAssignment = string;
export type PresetId = 'free' | 'economy' | 'balanced' | 'premium';

export type JobKind = 'plan' | 'framework' | 'segment' | 'review' | 'final-review';

export type Config = {
  studio: string; // path to the Remotion studio, relative to the config file
  preset: PresetId;
  budgetUSD: number; // hard cap; run pauses when reached
  connections: Record<string, Connection>;
  models: Record<string, ModelInfo>; // key = ModelInfo.ref
  roles: Record<RoleId, RoleAssignment>;
  gates: {retries: number; reviewMinScore: number; parallel: number};
  estimates: Record<JobKind, {inTokens: number; outTokens: number; minutes: number}>; // per job, used before a run
};

// ── Plan (director output; data, never code) ───────────────────────────────────────────────────
export type Format = '16:9' | '9:16' | '1:1';
export type Brand = {
  name: string;
  colors: Record<string, string>; // name → hex
  fonts: {display: string; body?: string; mono?: string}; // Google Fonts family names
  tagline?: string;
  facts: string[]; // the ONLY product claims allowed on screen
};
export type Segment = {
  id: string; // /^[a-z][a-z0-9]{1,15}$/
  name: string; // on-screen name
  startFrame: number; // global, bar-aligned
  endFrame: number;
  accent: string; // hex
  brief: string; // beat-by-beat picture spec
  illusion?: string;
  music: string; // sound design spec
  copy: string[]; // exact on-screen text allowed
  entrance: string; // motif it emerges from (previous segment's exit)
  exit: string; // motif it turns into (next segment's entrance)
};
export type Plan = {
  slug: string; // /^[a-z][a-z0-9-]{2,30}$/ → studio/src/<slug>/, composition id derived from it
  title: string;
  seconds: number;
  fps: 60 | 30;
  format: Format;
  width: number;
  height: number;
  bpm: number;
  brand: Brand;
  intro: {endFrame: number; brief: string; music: string};
  outro: {startFrame: number; brief: string; music: string};
  segments: Segment[];
  truthRules: string[];
};

// ── Jobs, gates, runs ──────────────────────────────────────────────────────────────────────────
export type JobStatus =
  | 'queued'
  | 'waiting-host' // assigned to "host": waits for an MCP/HTTP client to claim_job
  | 'building'
  | 'gates'
  | 'review'
  | 'retrying'
  | 'escalated'
  | 'accepted'
  | 'failed'
  | 'cancelled';
export type GateName = 'ownership' | 'typecheck' | 'determinism' | 'stills' | 'sound' | 'review';
export type GateResult = {gate: GateName; ok: boolean; details: string; data?: unknown};
export type Usage = {inTokens: number; outTokens: number; cachedInTokens?: number; costUSD: number};

export type Job = {
  id: string;
  runId: string;
  kind: JobKind;
  segmentId?: string;
  role: RoleId;
  assignee: RoleAssignment;
  allow: string[]; // write globs, relative to the studio root
  prompt: string; // full task spec handed to the worker (Markdown)
  status: JobStatus;
  attempt: number;
  claimedBy?: string; // host worker name
  gates: GateResult[];
  usage: Usage;
  stills: string[]; // absolute paths
  log: string[]; // short human-readable lines
  startedAt?: string;
  endedAt?: string;
};

export type RunStatus =
  | 'planning'
  | 'awaiting-approval' // plan + estimate ready; user approves before money is spent
  | 'scaffolding'
  | 'building'
  | 'integrating'
  | 'rendering'
  | 'done'
  | 'paused-budget'
  | 'failed'
  | 'cancelled';

export type Run = {
  id: string;
  createdAt: string;
  idea: string;
  status: RunStatus;
  plan?: Plan;
  config: Config; // snapshot used by this run
  jobs: Job[];
  spentUSD: number;
  estimate?: Estimate;
  branch?: string; // git branch the run commits to
  output?: string; // absolute path of the final MP4
  error?: string;
};

export type RunEvent = {
  t: string; // ISO time
  runId: string;
  type: 'run' | 'job' | 'gate' | 'usage' | 'log';
  jobId?: string;
  message: string;
  data?: unknown;
};

// ── Estimates ──────────────────────────────────────────────────────────────────────────────────
export type RoleEstimate = {
  role: RoleId;
  assignee: RoleAssignment;
  jobs: number;
  inTokens: number;
  outTokens: number;
  costUSD: number | null; // null = price unknown
  minutes: number; // wall-clock incl. rate limits
};
export type Estimate = {roles: RoleEstimate[]; totalUSD: number | null; totalMinutes: number; withinBudget: boolean | null; notes: string[]};

// ── Providers (API connections) ────────────────────────────────────────────────────────────────
export type ContentPart = {type: 'text'; text: string} | {type: 'image_url'; image_url: {url: string}};
export type ToolCall = {id: string; type: 'function'; function: {name: string; arguments: string}};
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[] | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  [extra: string]: unknown; // provider extras (reasoning/thought signatures) are passed back untouched
};
export type ToolDef = {name: string; description: string; parameters: Record<string, unknown>}; // JSON Schema
export type ChatResult = {message: ChatMessage; usage: Usage};

export interface Provider {
  connection: Connection;
  chat(model: string, messages: ChatMessage[], tools: ToolDef[], price?: Price): Promise<ChatResult>;
  listModels(): Promise<string[]>;
}

// ── The facade every interface (MCP, HTTP API, CLI, dashboard) calls ──────────────────────────
export interface Orchestrator {
  plan(input: {idea: string; seconds: number; format?: Format; brandNotes?: string; plan?: Plan}): Promise<Run>; // a host may pass its own plan
  estimate(runId: string): Promise<Estimate>;
  getConfig(): Promise<Config>;
  setRoles(input: {runId?: string; preset?: PresetId; roles?: Partial<Record<RoleId, RoleAssignment>>; budgetUSD?: number; models?: ModelInfo[]}): Promise<Config>;
  listModels(connectionId: string): Promise<string[]>;
  start(runId: string): Promise<Run>; // requires status awaiting-approval (or explicit approve)
  status(runId: string): Promise<Run>;
  listRuns(): Promise<Array<Pick<Run, 'id' | 'idea' | 'status' | 'createdAt' | 'spentUSD' | 'output'>>>;
  claimJob(input: {runId: string; worker: string}): Promise<Job | null>; // host workers
  submitJob(input: {jobId: string; note?: string}): Promise<Job>; // runs gates, then review
  runGates(jobId: string): Promise<GateResult[]>; // dry run, no state change
  stills(jobId: string): Promise<string[]>;
  approve(input: {runId: string; what: 'plan' | 'budget' | 'final'}): Promise<Run>;
  cancel(runId: string): Promise<Run>;
  subscribe(runId: string, cb: (e: RunEvent) => void): () => void;
}
