// HTTP plumbing shared by both wire formats: one process-wide limiter per connection id (rpm/rpd/tpm),
// retries on 429/5xx/network errors with exponential backoff honoring Retry-After, and API key lookup.
import type {Connection} from '../types.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type Slot = {t: number; tokens: number}; // set .tokens to the real usage once known (tpm accounting)

// ponytail: in-process only. rpm is enforced as even spacing (60s/rpm between requests), which never bursts past a
// per-minute limit; rpd counts the last 24 h of this process. Persist the counters if runs span several processes.
class Limiter {
  last = -Infinity;
  minute: Slot[] = [];
  day: number[] = [];
  chain: Promise<unknown> = Promise.resolve();

  acquire(c: Connection, estTokens: number): Promise<Slot> {
    const p = this.chain.then(() => this.wait(c, estTokens));
    this.chain = p.catch(() => {});
    return p;
  }

  private async wait(c: Connection, est: number): Promise<Slot> {
    for (;;) {
      const now = Date.now();
      this.minute = this.minute.filter((s) => s.t > now - MINUTE);
      this.day = this.day.filter((t) => t > now - DAY);
      if (c.rpd && this.day.length >= c.rpd)
        throw new Error(
          `Daily request limit reached for connection "${c.id}" (rpd ${c.rpd}); it frees up at ${new Date(this.day[0] + DAY).toISOString()}. Raise rpd in motion.config.json if your tier allows more, or assign another connection.`,
        );
      let until = now;
      if (c.rpm) until = Math.max(until, this.last + MINUTE / c.rpm);
      if (c.tpm && this.minute.length && this.minute.reduce((n, s) => n + s.tokens, 0) + est > c.tpm) until = Math.max(until, this.minute[0].t + MINUTE);
      if (until <= now) break;
      await sleep(until - now);
    }
    const slot = {t: Date.now(), tokens: est};
    this.last = slot.t;
    this.minute.push(slot);
    this.day.push(slot.t);
    return slot;
  }
}

const limiters = new Map<string, Limiter>();
export function limiterFor(id: string): Limiter {
  let l = limiters.get(id);
  if (!l) limiters.set(id, (l = new Limiter()));
  return l;
}

export function apiKey(c: Connection): string | undefined {
  if (!c.keyEnv) return undefined;
  const k = process.env[c.keyEnv];
  if (!k) throw new Error(`Missing API key for connection "${c.id}": set the environment variable ${c.keyEnv}.`);
  return k;
}

export function baseUrl(c: Connection): string {
  if (!c.baseUrl) throw new Error(`Connection "${c.id}" has no baseUrl.`);
  return c.baseUrl.replace(/\/+$/, '');
}

function retryAfterMs(res: Response): number | undefined {
  const h = res.headers.get('retry-after');
  if (!h) return undefined;
  const s = Number(h);
  if (Number.isFinite(s)) return Math.max(0, s * 1000);
  const d = Date.parse(h);
  return Number.isNaN(d) ? undefined : Math.max(0, d - Date.now());
}

const RETRIES = 5;
const REQUEST_TIMEOUT = 15 * MINUTE;

// Rate-limited, retrying JSON request. Every attempt takes a limiter slot.
export async function requestJSON(c: Connection, url: string, init: RequestInit, estTokens = 0): Promise<{json: any; slot: Slot}> {
  const limiter = limiterFor(c.id);
  for (let attempt = 0; ; attempt++) {
    const slot = await limiter.acquire(c, estTokens);
    let res: Response;
    try {
      res = await fetch(url, {...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT)});
    } catch (e) {
      if (attempt >= RETRIES) throw new Error(`${c.id}: request to ${url} failed: ${(e as Error).message}`);
      await sleep(Math.min(60_000, 1000 * 2 ** attempt));
      continue;
    }
    if (res.ok) {
      const text = await res.text();
      try {
        return {json: JSON.parse(text), slot};
      } catch {
        throw new Error(`${c.id}: non-JSON response from ${url}: ${text.slice(0, 500)}`);
      }
    }
    const body = await res.text().catch(() => '');
    if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
      await sleep(retryAfterMs(res) ?? Math.min(60_000, 1000 * 2 ** attempt));
      continue;
    }
    throw new Error(`${c.id} API ${res.status} ${res.statusText} (${url}): ${body.slice(0, 1000)}`);
  }
}
