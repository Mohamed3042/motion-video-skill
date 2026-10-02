// Git per run: branch `mvo/<slug>-<runId>`, one commit per accepted job, rejected jobs reset to the last good commit.
// Commits go through a private index file (GIT_INDEX_FILE) + commit-tree/update-ref, so the user's checkout, HEAD,
// staging area and uncommitted work elsewhere are never touched. Never pushes. All git calls are serialized.
import {existsSync, rmSync} from 'node:fs';
import path from 'node:path';
import {exec} from './exec.ts';

export class RunGit {
  private chain: Promise<unknown> = Promise.resolve();
  readonly repo: string;
  readonly studioRel: string; // studio dir relative to the repo root ('' if the same)
  readonly branch: string;
  private indexFile: string;
  private identity: string[];
  private constructor(repo: string, studioRel: string, branch: string, indexFile: string, identity: string[]) {
    this.repo = repo;
    this.studioRel = studioRel;
    this.branch = branch;
    this.indexFile = indexFile;
    this.identity = identity;
  }

  // null when the studio is not inside a git work tree (commits/resets are then skipped)
  static async open(studioRoot: string, branch: string, indexFile: string): Promise<RunGit | null> {
    const top = await exec('git', ['rev-parse', '--show-toplevel'], {cwd: studioRoot});
    if (top.code !== 0) return null;
    const repo = path.resolve(top.out.trim());
    const name = await exec('git', ['config', 'user.name'], {cwd: repo});
    const email = await exec('git', ['config', 'user.email'], {cwd: repo});
    const identity = name.out.trim() && email.out.trim() ? [] : ['-c', 'user.name=motion-orchestrator', '-c', 'user.email=mvo@localhost'];
    const g = new RunGit(repo, path.relative(repo, path.resolve(studioRoot)).split(path.sep).join('/'), branch, indexFile, identity);
    const has = await g.git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]);
    if (has.code !== 0) {
      const head = await g.git(['rev-parse', '--verify', '--quiet', 'HEAD']);
      if (head.code !== 0) throw new Error('the repository has no commits yet; make an initial commit first');
      const mk = await g.git(['branch', branch, head.out.trim()]);
      if (mk.code !== 0) throw new Error(`git branch ${branch} failed: ${mk.out}`);
    }
    return g;
  }

  private git(args: string[], index = false) {
    return exec('git', args, {cwd: this.repo, env: index ? {...process.env, GIT_INDEX_FILE: this.indexFile} : process.env});
  }
  private async must(args: string[], index = false): Promise<string> {
    const r = await this.git(args, index);
    if (r.code !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.out.trim()}`);
    return r.out;
  }
  private lock<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.chain.then(fn);
    this.chain = p.catch(() => {});
    return p;
  }
  // studio-relative globs → repo-relative glob pathspecs
  private specs(globs: string[]) {
    return globs.map((g) => `:(glob)${this.studioRel ? `${this.studioRel}/` : ''}${g}`);
  }

  tip(): Promise<string> {
    return this.lock(async () => (await this.must(['rev-parse', `refs/heads/${this.branch}`])).trim());
  }

  // Is a studio-relative file unchanged vs HEAD (so committing it would not sweep up the user's own edits)?
  async clean(rel: string): Promise<boolean> {
    return (await this.git(['diff', '--quiet', 'HEAD', '--', `${this.studioRel ? `${this.studioRel}/` : ''}${rel}`])).code === 0;
  }

  // Commit the current working-tree state of the matching files onto the run branch. null = nothing changed.
  commit(globs: string[], message: string): Promise<string | null> {
    return this.lock(async () => {
      const tip = (await this.must(['rev-parse', `refs/heads/${this.branch}`])).trim();
      await this.must(['read-tree', tip], true);
      for (const spec of this.specs(globs)) {
        const r = await this.git(['add', '-A', '--', spec], true);
        if (r.code !== 0 && !/did not match any files/.test(r.out)) throw new Error(`git add ${spec} failed: ${r.out.trim()}`);
      }
      const tree = (await this.must(['write-tree'], true)).trim();
      if (tree === (await this.must(['rev-parse', `${tip}^{tree}`])).trim()) return null;
      const commit = (await this.must([...this.identity, 'commit-tree', tree, '-p', tip, '-m', message])).trim();
      await this.must(['update-ref', `refs/heads/${this.branch}`, commit, tip]);
      return commit;
    });
  }

  // Put the matching files back to the run branch tip: tracked ones restored, new (non-ignored) ones deleted.
  reset(globs: string[]): Promise<string[]> {
    return this.lock(async () => {
      const tip = (await this.must(['rev-parse', `refs/heads/${this.branch}`])).trim();
      await this.must(['read-tree', tip], true);
      const specs = this.specs(globs);
      const tracked = (await this.must(['ls-files', '-z', '--', ...specs], true)).split('\0').filter(Boolean);
      if (tracked.length) await this.must(['checkout-index', '-f', '--', ...tracked], true);
      const extra = (await this.must(['ls-files', '-z', '--others', '--exclude-standard', '--', ...specs], true)).split('\0').filter(Boolean);
      for (const f of extra) rmSync(path.join(this.repo, f), {force: true});
      return [...tracked, ...extra.map((f) => `${f} (deleted)`)];
    });
  }

  // Tests / cleanup only: drop the run branch and the private index.
  async destroy(): Promise<void> {
    await this.lock(async () => {
      await this.git(['branch', '-D', this.branch]);
      if (existsSync(this.indexFile)) rmSync(this.indexFile, {force: true});
    });
  }
}
