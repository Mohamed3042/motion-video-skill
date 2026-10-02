// Run persistence (<repoRoot>/.motion/runs/<runId>/{run.json, events.jsonl, stills/, logs/}) + an in-process event bus.
import {appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import type {Run, RunEvent} from '../types.ts';

export class Store {
  readonly root: string;
  private subs = new Map<string, Set<(e: RunEvent) => void>>();

  constructor(repoRoot: string) {
    this.root = path.join(repoRoot, '.motion', 'runs');
    mkdirSync(this.root, {recursive: true});
  }

  newRunId(): string {
    // sortable and short: r<yyyymmdd-hhmmss>-<4 hex>
    const t = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    return `r${t}-${Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')}`.toLowerCase();
  }

  dir(runId: string, ...sub: string[]): string {
    const d = path.join(this.root, runId, ...sub);
    mkdirSync(d, {recursive: true});
    return d;
  }

  save(run: Run): void {
    const file = path.join(this.dir(run.id), 'run.json');
    writeFileSync(file + '.tmp', JSON.stringify(run, null, 2));
    renameSync(file + '.tmp', file);
  }

  load(runId: string): Run {
    const file = path.join(this.root, runId, 'run.json');
    if (!existsSync(file)) throw new Error(`unknown run "${runId}"`);
    return JSON.parse(readFileSync(file, 'utf8')) as Run;
  }

  list(): Run[] {
    return readdirSync(this.root, {withFileTypes: true})
      .filter((d) => d.isDirectory() && existsSync(path.join(this.root, d.name, 'run.json')))
      .map((d) => this.load(d.name))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  emit(runId: string, type: RunEvent['type'], message: string, extra: {jobId?: string; data?: unknown} = {}): RunEvent {
    const e: RunEvent = {t: new Date().toISOString(), runId, type, message, ...extra};
    try {
      appendFileSync(path.join(this.dir(runId), 'events.jsonl'), JSON.stringify(e) + '\n');
    } catch {
      /* never let logging break a run */
    }
    for (const cb of this.subs.get(runId) ?? []) {
      try {
        cb(e);
      } catch {
        /* a broken subscriber must not break the run */
      }
    }
    return e;
  }

  events(runId: string): RunEvent[] {
    const file = path.join(this.root, runId, 'events.jsonl');
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as RunEvent);
  }

  subscribe(runId: string, cb: (e: RunEvent) => void): () => void {
    let set = this.subs.get(runId);
    if (!set) this.subs.set(runId, (set = new Set()));
    set.add(cb);
    return () => {
      set.delete(cb);
    };
  }
}
