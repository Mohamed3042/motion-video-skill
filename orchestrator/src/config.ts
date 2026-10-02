// motion.config.json: load + validate (zod), defaults, presets, role resolution. Vendor-neutral: every
// connection is just a wire format (openai / anthropic) + base URL + env var name; prices live in `models`.
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {ROLES} from './types.ts';
import type {Config, Connection, ModelInfo, PresetId, RoleAssignment, RoleId} from './types.ts';

export const CONFIG_FILE = 'motion.config.json';

// '<connection>/?' = "the user must pick a model on this connection" (premium slot).
export const PRESETS: Record<PresetId, Record<RoleId, RoleAssignment>> = {
  free: {director: 'host', builder: 'gemini-free/gemini-3.6-flash', reviewer: 'gemini-free/gemini-3.6-flash', escalation: 'host'},
  economy: {director: 'deepseek/deepseek-flash', builder: 'deepseek/deepseek-flash', reviewer: 'gemini-free/gemini-3.6-flash', escalation: 'deepseek/deepseek-v4-pro'},
  balanced: {director: 'openai/?', builder: 'deepseek/deepseek-flash', reviewer: 'gemini-free/gemini-3.6-flash', escalation: 'deepseek/deepseek-v4-pro'},
  premium: {director: 'openai/?', builder: 'openai/?', reviewer: 'openai/?', escalation: 'openai/?'},
};

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/openai';

export function defaultConfig(): Config {
  const connections: Record<string, Connection & {note?: string}> = {
    openai: {id: 'openai', kind: 'openai', baseUrl: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY'},
    anthropic: {id: 'anthropic', kind: 'anthropic', baseUrl: 'https://api.anthropic.com', keyEnv: 'ANTHROPIC_API_KEY'},
    deepseek: {id: 'deepseek', kind: 'openai', baseUrl: 'https://api.deepseek.com', keyEnv: 'DEEPSEEK_API_KEY'},
    xai: {id: 'xai', kind: 'openai', baseUrl: 'https://api.x.ai/v1', keyEnv: 'XAI_API_KEY'},
    gemini: {id: 'gemini', kind: 'openai', baseUrl: GEMINI, keyEnv: 'GEMINI_API_KEY'},
    'gemini-free': {id: 'gemini-free', kind: 'openai', baseUrl: GEMINI, keyEnv: 'GEMINI_API_KEY', free: true, rpm: 10, rpd: 250, note: 'rpm/rpd: edit to match your tier'},
    openrouter: {id: 'openrouter', kind: 'openai', baseUrl: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY'},
    ollama: {id: 'ollama', kind: 'openai', baseUrl: 'http://127.0.0.1:11434/v1', free: true},
    lmstudio: {id: 'lmstudio', kind: 'openai', baseUrl: 'http://127.0.0.1:1234/v1', free: true},
    host: {id: 'host', kind: 'mcp-host'},
  };
  const models: ModelInfo[] = [
    {ref: 'deepseek/deepseek-flash', price: {inPerM: 0.3, outPerM: 1.2, cachedInPerM: 0.003}, vision: true, note: 'DeepSeek-V4.1-Flash; peak rates, verify current prices'},
    {ref: 'deepseek/deepseek-v4-pro', note: 'enter price'},
    {ref: 'gemini-free/gemini-3.6-flash', vision: true, note: 'free tier: $0'},
    {ref: 'xai/grok-4.7', note: 'enter price'},
  ];
  return {
    studio: 'studio',
    preset: 'balanced',
    budgetUSD: 5,
    connections,
    models: Object.fromEntries(models.map((m) => [m.ref, m])),
    roles: {...PRESETS.balanced},
    gates: {retries: 2, reviewMinScore: 7, parallel: 3},
    estimates: {
      plan: {inTokens: 60_000, outTokens: 8_000, minutes: 2},
      framework: {inTokens: 300_000, outTokens: 40_000, minutes: 30},
      segment: {inTokens: 190_000, outTokens: 25_000, minutes: 25},
      review: {inTokens: 25_000, outTokens: 1_000, minutes: 1},
      'final-review': {inTokens: 40_000, outTokens: 2_000, minutes: 2},
    },
  };
}

// ── validation ──────────────────────────────────────────────────────────────────────────────────
const Num = z.number().nonnegative();
const Pos = z.number().positive();
const ConnectionZ = z.looseObject({
  id: z.string().min(1),
  kind: z.enum(['openai', 'anthropic', 'mcp-host']),
  baseUrl: z.url().optional(),
  keyEnv: z.string().min(1).optional(),
  free: z.boolean().optional(),
  rpm: Pos.optional(),
  rpd: Pos.optional(),
  tpm: Pos.optional(),
  headers: z.record(z.string(), z.string()).optional(),
});
const ModelZ = z.looseObject({
  ref: z.string().min(3),
  price: z.object({inPerM: Num, outPerM: Num, cachedInPerM: Num.optional()}).optional(),
  vision: z.boolean().optional(),
  note: z.string().optional(),
});
const EstZ = z.object({inTokens: Num, outTokens: Num, minutes: Num});
const ConfigZ = z.looseObject({
  studio: z.string().min(1),
  preset: z.enum(['free', 'economy', 'balanced', 'premium']),
  budgetUSD: Num,
  connections: z.record(z.string(), ConnectionZ),
  models: z.record(z.string(), ModelZ),
  roles: z.object({director: z.string().min(1), builder: z.string().min(1), reviewer: z.string().min(1), escalation: z.string().min(1)}),
  gates: z.object({retries: z.int().min(0), reviewMinScore: z.number().min(0).max(10), parallel: z.int().min(1)}),
  estimates: z.object({plan: EstZ, framework: EstZ, segment: EstZ, review: EstZ, 'final-review': EstZ}),
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// Deep merge; `null` in the file deletes a default (e.g. "gemini-free": null, or "price": null).
function merge(def: unknown, over: unknown): unknown {
  if (over === undefined) return def;
  if (!isObj(def) || !isObj(over)) return over;
  const out: Record<string, unknown> = {...def};
  for (const [k, v] of Object.entries(over)) {
    if (v === null) delete out[k];
    else out[k] = merge(def[k], v);
  }
  return out;
}

function validate(raw: unknown, where: string): Config {
  if (!isObj(raw)) throw new Error(`${where}: expected a JSON object`);
  const base = defaultConfig();
  if (typeof raw.preset === 'string' && raw.preset in PRESETS) base.roles = {...PRESETS[raw.preset as PresetId]};
  const merged = merge(base, raw) as Record<string, any>;
  // record keys are canonical (roles reference them)
  for (const [k, c] of Object.entries(merged.connections ?? {})) if (isObj(c)) c.id = k;
  for (const [k, m] of Object.entries(merged.models ?? {})) if (isObj(m)) m.ref = k;
  const r = ConfigZ.safeParse(merged);
  if (!r.success) throw new Error(`Invalid ${where}:\n${z.prettifyError(r.error)}`);
  return r.data as unknown as Config;
}

function findConfig(): string {
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    const p = join(dir, CONFIG_FILE);
    if (existsSync(p)) return p;
    if (dirname(dir) === dir) break;
  }
  return fileURLToPath(new URL(`../../${CONFIG_FILE}`, import.meta.url)); // <orchestrator>/../motion.config.json
}

export async function loadConfig(path?: string): Promise<{config: Config; path: string}> {
  const p = resolve(path ?? findConfig());
  if (!existsSync(p)) return {config: defaultConfig(), path: p};
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(p, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot parse ${p}: ${(e as Error).message}`);
  }
  return {config: validate(raw, p), path: p};
}

// Defaults missing from `cur` are written as null, so a deleted default stays deleted after the next load's merge.
function markDeleted(def: unknown, cur: unknown): unknown {
  if (!isObj(def) || !isObj(cur)) return cur;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(def)) if (!(k in cur)) out[k] = null;
  for (const [k, v] of Object.entries(cur)) out[k] = markDeleted(def[k], v);
  return out;
}

export async function saveConfig(config: Config, path: string): Promise<void> {
  validate(config, 'config');
  const {roles: _roles, ...def} = defaultConfig(); // roles always has all four keys
  await mkdir(dirname(resolve(path)), {recursive: true});
  await writeFile(path, `${JSON.stringify(markDeleted(def, config), null, 2)}\n`);
}

// Keeps a model the user already picked on a preset's '<conn>/?' slot (e.g. balanced → premium keeps openai/gpt-x).
export function applyPreset(config: Config, preset: PresetId): Config {
  const roles = {...PRESETS[preset]};
  for (const r of ROLES) {
    const cur = config.roles[r];
    if (roles[r].endsWith('/?') && cur?.startsWith(roles[r].slice(0, -1)) && !cur.endsWith('/?')) roles[r] = cur;
  }
  return {...config, preset, roles};
}

export type ResolvedRole = {kind: 'host'} | {kind: 'api'; connection: Connection; model: string; info?: ModelInfo};

export function resolveRole(config: Config, role: RoleId): ResolvedRole {
  const a = config.roles[role]?.trim();
  if (!a) throw new Error(`Pick a model for ${role}: no assignment (set roles.${role} to "<connection>/<model>" or "host").`);
  if (a === 'host') return {kind: 'host'};
  const i = a.indexOf('/');
  const connId = i < 0 ? a : a.slice(0, i);
  const model = i < 0 ? '' : a.slice(i + 1); // model ids may contain '/' (OpenRouter)
  const connection = config.connections[connId];
  if (!connection)
    throw new Error(`Pick a model for ${role}: unknown connection "${connId}" in "${a}" (known: ${Object.keys(config.connections).join(', ')}).`);
  if (connection.kind === 'mcp-host') return {kind: 'host'};
  if (!model || model === '?')
    throw new Error(`Pick a model for ${role}: "${a}" is a placeholder. Set roles.${role} to "${connId}/<model id>" (list models with the dashboard or listModels("${connId}")).`);
  return {kind: 'api', connection: {...connection, id: connId}, model, info: config.models[`${connId}/${model}`]};
}

export function studioRoot(config: Config, configPath: string): string {
  return resolve(dirname(resolve(configPath)), config.studio);
}

export function validateRoles(config: Config): string[] {
  const problems = new Set<string>();
  for (const role of ROLES) {
    let r: ResolvedRole;
    try {
      r = resolveRole(config, role);
    } catch (e) {
      problems.add((e as Error).message);
      continue;
    }
    if (r.kind === 'host') continue;
    const ref = `${r.connection.id}/${r.model}`;
    if (!r.connection.baseUrl) problems.add(`${role}: connection "${r.connection.id}" has no baseUrl.`);
    if (r.connection.keyEnv && !process.env[r.connection.keyEnv])
      problems.add(`${role}: ${ref} needs the API key env var ${r.connection.keyEnv} (connection "${r.connection.id}"), which is not set.`);
    if (!r.connection.free && !r.info?.price)
      problems.add(`${role}: no price for ${ref}, so spend cannot be checked against the budget. Add models["${ref}"].price ({inPerM, outPerM} USD per 1M tokens).`);
    if (role === 'reviewer' && !r.info?.vision)
      problems.add(`reviewer: ${ref} is not marked as vision-capable; the reviewer must look at stills. Set models["${ref}"].vision = true if it can.`);
  }
  return [...problems];
}
