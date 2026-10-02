// Child processes for the pipeline: no shell (args are passed as-is), output captured, whole process tree killed on
// abort/timeout. Studio CLIs run as `node <studio>/node_modules/<pkg>/<bin>` so nothing depends on npx or PATH shims.
import {spawn} from 'node:child_process';
import path from 'node:path';

export type ExecResult = {code: number; out: string; ms: number};

export function exec(cmd: string, args: string[], o: {cwd: string; signal?: AbortSignal; timeoutMs?: number; env?: NodeJS.ProcessEnv}): Promise<ExecResult> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    if (o.signal?.aborted) return resolve({code: -1, out: 'aborted', ms: 0});
    const child = spawn(cmd, args, {cwd: o.cwd, env: o.env ?? process.env, windowsHide: true});
    let out = '';
    const onData = (d: Buffer) => {
      out += d.toString();
      if (out.length > 400_000) out = out.slice(-200_000);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const kill = () => {
      try {
        if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {windowsHide: true});
        else child.kill('SIGKILL');
      } catch {}
    };
    const timer = o.timeoutMs ? setTimeout(() => ((out += `\n(timed out after ${Math.round(o.timeoutMs! / 1000)} s)`), kill()), o.timeoutMs) : undefined;
    o.signal?.addEventListener('abort', kill, {once: true});
    child.on('error', (e) => (out += `\n${e.message}`));
    child.on('close', (code) => {
      clearTimeout(timer);
      o.signal?.removeEventListener('abort', kill);
      resolve({code: code ?? -1, out, ms: Date.now() - t0});
    });
  });
}

// `node <studio>/node_modules/<bin> ...args` (e.g. typescript/bin/tsc, @remotion/cli/remotion-cli.js)
export const studioBin = (studioRoot: string, bin: string, args: string[], o: {signal?: AbortSignal; timeoutMs?: number} = {}) =>
  exec(process.execPath, [path.join(studioRoot, 'node_modules', bin), ...args], {cwd: studioRoot, ...o});

export const node = (studioRoot: string, script: string, args: string[], o: {signal?: AbortSignal; timeoutMs?: number} = {}) =>
  exec(process.execPath, [script, ...args], {cwd: studioRoot, ...o});

export const tail = (s: string, n = 4000) => (s.length > n ? `…${s.slice(-n)}` : s);
