// Budget: cost/time estimate before a run (per-job token estimates × price table) and a ledger of real usage.
import {resolveRole} from './config.ts';
import {costOf} from './providers/cost.ts';
import {ROLES} from './types.ts';
import type {Config, Connection, Estimate, JobKind, RoleEstimate, RoleId, Usage} from './types.ts';

const TOKENS_PER_REQUEST = 8_000; // rough: an agent loop makes ~1 request per 8k input tokens
const ESCALATION_SHARE = 0.15; // reserve: 15% of builder work gets retaken by the escalation role

type Work = {jobs: number; in: number; out: number; min: number};

export function estimateRun(config: Config, segments: number): Estimate {
  const e = config.estimates;
  const P = Math.max(1, config.gates.parallel);
  const work = (jobs: number, kinds: [JobKind, number][]): Work =>
    kinds.reduce((w, [k, n]) => ({jobs, in: w.in + n * e[k].inTokens, out: w.out + n * e[k].outTokens, min: w.min + n * e[k].minutes}), {jobs, in: 0, out: 0, min: 0});
  const b = work(1 + segments, [['framework', 1], ['segment', segments]]);
  const w: Record<RoleId, Work> = {
    director: work(2, [['plan', 1], ['final-review', 1]]),
    builder: b,
    reviewer: work(segments, [['review', segments]]),
    escalation: {jobs: Math.ceil(ESCALATION_SHARE * b.jobs), in: ESCALATION_SHARE * b.in, out: ESCALATION_SHARE * b.out, min: ESCALATION_SHARE * b.min},
  };

  const notes = new Set<string>(['Token estimates assume no prompt-cache hits, so API costs are an upper bound.']);
  const conns = new Map<string, {c: Connection; in: number; out: number; build: boolean}[]>();
  const rateMin = (c: Connection, inTok: number, outTok: number) =>
    Math.max(c.rpm ? inTok / TOKENS_PER_REQUEST / c.rpm : 0, c.tpm ? (inTok + outTok) / c.tpm : 0);

  const roles: RoleEstimate[] = ROLES.map((role) => {
    const x = w[role];
    const assignee = config.roles[role];
    let costUSD: number | null = null;
    let minutes = role === 'director' ? x.min : x.min / P;
    if (role === 'builder' && segments) minutes = Math.max(minutes, e.framework.minutes, e.segment.minutes);
    try {
      const r = resolveRole(config, role);
      if (r.kind === 'host') {
        costUSD = 0;
        notes.add(`${role} runs on the connected agent (host): $0 extra, it uses that agent's own subscription.`);
      } else {
        const ref = `${r.connection.id}/${r.model}`;
        const price = r.info?.price;
        if (r.connection.free) {
          costUSD = 0;
          const lim = [r.connection.rpm && `rpm ${r.connection.rpm}`, r.connection.rpd && `rpd ${r.connection.rpd}`, r.connection.tpm && `tpm ${r.connection.tpm}`].filter(Boolean).join(', ');
          notes.add(`${role} uses the free connection "${r.connection.id}": $0${lim ? `, rate-limited (${lim}; edit to match your tier)` : ''}.`);
        } else if (price) costUSD = costOf({inTokens: x.in, outTokens: x.out}, price);
        else notes.add(`${role}: no price for ${ref}, so the total is unknown. Enter models["${ref}"].price (USD per 1M tokens).`);
        minutes = Math.max(minutes, rateMin(r.connection, x.in, x.out));
        const list = conns.get(r.connection.id) ?? [];
        list.push({c: r.connection, in: x.in, out: x.out, build: role !== 'director'});
        conns.set(r.connection.id, list);
      }
    } catch (err) {
      notes.add((err as Error).message);
    }
    return {role, assignee, jobs: x.jobs, inTokens: Math.round(x.in), outTokens: Math.round(x.out), costUSD: costUSD === null ? null : round(costUSD), minutes: Math.ceil(minutes)};
  });

  // Wall clock: director (plan + final review) is sequential; builders, reviews and retakes share P parallel slots
  // and, per connection, that connection's rate limits.
  let build = Math.max(segments ? e.segment.minutes + e.review.minutes : 0, e.framework.minutes, (b.min + w.reviewer.min + w.escalation.min) / P);
  for (const [id, list] of conns) {
    const c = list[0].c;
    const bIn = list.filter((l) => l.build).reduce((n, l) => n + l.in, 0);
    const bOut = list.filter((l) => l.build).reduce((n, l) => n + l.out, 0);
    build = Math.max(build, rateMin(c, bIn, bOut));
    const requests = Math.ceil(list.reduce((n, l) => n + l.in, 0) / TOKENS_PER_REQUEST);
    if (c.rpd && requests > c.rpd) notes.add(`"${id}" needs ~${requests} requests but allows ${c.rpd}/day: the run will hit the daily limit (escalation takes over failed jobs).`);
  }
  const totalMinutes = Math.ceil(roles.find((r) => r.role === 'director')!.minutes + build);
  const totalUSD = roles.some((r) => r.costUSD === null) ? null : round(roles.reduce((s, r) => s + (r.costUSD ?? 0), 0));
  return {roles, totalUSD, totalMinutes, withinBudget: totalUSD === null ? null : totalUSD <= config.budgetUSD, notes: [...notes]};
}

const round = (n: number) => Math.round(n * 10_000) / 10_000;
const zero = (): Usage => ({inTokens: 0, outTokens: 0, cachedInTokens: 0, costUSD: 0});

export class Ledger {
  #by: Record<RoleId, Usage>;
  constructor(initial?: Partial<Record<RoleId, Usage>>) {
    this.#by = Object.fromEntries(ROLES.map((r) => [r, {...zero(), ...initial?.[r]}])) as Record<RoleId, Usage>;
  }
  add(role: RoleId, u: Usage): void {
    const t = this.#by[role];
    t.inTokens += u.inTokens;
    t.outTokens += u.outTokens;
    t.cachedInTokens = (t.cachedInTokens ?? 0) + (u.cachedInTokens ?? 0);
    t.costUSD += u.costUSD;
  }
  get spentUSD(): number {
    return ROLES.reduce((s, r) => s + this.#by[r].costUSD, 0);
  }
  byRole(): Record<RoleId, Usage> {
    return structuredClone(this.#by);
  }
  remaining(budgetUSD: number): number {
    return budgetUSD - this.spentUSD;
  }
}
