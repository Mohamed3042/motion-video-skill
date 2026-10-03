// HTTP JSON API + Server-Sent Events + static dashboard, on node:http. Same ops as MCP and the CLI.
//   POST /api/<op>          JSON in, JSON out (zod-validated)
//   GET  /api/ops           self-description: name, description, JSON Schema of the input
//   GET  /api/events?run=   SSE stream of RunEvents
//   GET  /api/file?path=    stills / videos, only from <repoRoot>/.motion and <repoRoot>/outputs (Range support)
import {createServer as createHttpServer} from 'node:http';
import type {IncomingMessage, Server, ServerResponse} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile, realpath, stat} from 'node:fs/promises';
import {createHash, timingSafeEqual} from 'node:crypto';
import {extname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {callOp, describeOps, OpError} from '../api/ops.ts';
import type {Orchestrator} from '../types.ts';

export const DEFAULT_PORT = 4317;
export const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');
const PUBLIC = join(import.meta.dirname, 'public');
const STATIC: Record<string, [string, string]> = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};
const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const MAX_BODY = 4 * 1024 * 1024;

export type ServerOptions = {
  demo?: boolean; // label simulated jobs and hide the fake MP4 in the dashboard
  token?: string; // bearer token; defaults to env MVO_TOKEN
  fileRoots?: string[]; // folders /api/file may serve from
};

const sha = (s: string) => createHash('sha256').update(s).digest();
const send = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
  res.end(JSON.stringify(body));
};
const hostname = (hostHeader = '') => hostHeader.replace(/:\d+$/, '').toLowerCase();

function cookieToken(req: IncomingMessage): string | undefined {
  const m = /(?:^|;\s*)mvo_token=([^;]*)/.exec(req.headers.cookie ?? '');
  return m ? decodeURIComponent(m[1]) : undefined;
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw new OpError(413, 'Request body too large (max 4 MB).');
    chunks.push(c as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new OpError(400, 'Body must be JSON, e.g. {"runId": "..."}.');
  }
}

const inside = (root: string, p: string) => {
  const rel = relative(root, p);
  return !!rel && rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel);
};

/** Resolve `p` and make sure it is a real file inside one of `roots`. The lexical check runs first so paths outside
 *  the roots (e.g. UNC shares) are never touched on disk; the realpath check then defeats symlinks. */
async function safeFile(p: string, roots: string[]): Promise<string | null> {
  const abs = resolve(REPO_ROOT, p);
  for (const root of roots) {
    if (!inside(resolve(root), abs)) continue;
    try {
      const real = await realpath(abs);
      if (inside(await realpath(root), real)) return real;
    } catch {}
  }
  return null;
}

async function serveFile(req: IncomingMessage, res: ServerResponse, file: string) {
  const st = await stat(file);
  if (!st.isFile()) throw new OpError(404, 'Not a file.');
  const size = st.size;
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    start = Math.max(0, start);
    if (start > end || start >= size) {
      res.writeHead(416, {'content-range': `bytes */${size}`});
      return res.end();
    }
    res.writeHead(206, {'content-type': type, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes'});
    return createReadStream(file, {start, end}).on('error', () => res.destroy()).pipe(res);
  }
  res.writeHead(200, {'content-type': type, 'content-length': size, 'accept-ranges': 'bytes'});
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

export function createServer(orch: Orchestrator, opts: ServerOptions = {}): Server {
  const token = opts.token ?? process.env.MVO_TOKEN ?? '';
  const roots = opts.fileRoots ?? [join(REPO_ROOT, '.motion'), join(REPO_ROOT, 'outputs')];
  const ops = describeOps();

  const authorized = (req: IncomingMessage) => {
    if (!token) return true;
    const auth = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '')?.[1] ?? cookieToken(req);
    return !!auth && timingSafeEqual(sha(auth), sha(token));
  };

  return createHttpServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://local');
      // DNS-rebinding guard: without a token, only answer requests addressed to a loopback name.
      if (!token && !LOOPBACK.has(hostname(req.headers.host))) return send(res, 403, {error: 'Host not allowed. Set MVO_TOKEN to serve other hosts.'});
      // CSRF guard: browsers send Origin on cross-site requests; only same-origin pages may call us.
      const origin = req.headers.origin;
      if (origin && (origin === 'null' || new URL(origin).host !== req.headers.host)) return send(res, 403, {error: 'Cross-origin requests are not allowed.'});

      if (!url.pathname.startsWith('/api/')) {
        const s = STATIC[url.pathname];
        if (!s || req.method !== 'GET') return send(res, 404, {error: 'Not found'});
        res.writeHead(200, {'content-type': s[1], 'cache-control': 'no-cache'});
        const content = await readFile(join(PUBLIC, s[0]));
        return res.end(s[0] === 'index.html' && opts.demo
          ? content.toString('utf8').replace('data-demo="false"', 'data-demo="true"')
          : content);
      }

      if (!authorized(req)) return send(res, 401, {error: 'Unauthorized: send "Authorization: Bearer <MVO_TOKEN>".'});
      const route = url.pathname.slice('/api/'.length);

      if (req.method === 'GET' && route === 'ops') return send(res, 200, ops);

      if (req.method === 'GET' && route === 'events') {
        const runId = url.searchParams.get('run');
        if (!runId) return send(res, 400, {error: 'Missing ?run=<runId>'});
        res.writeHead(200, {'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive'});
        res.write(': connected\n\n');
        const off = orch.subscribe(runId, (e) => res.write(`data: ${JSON.stringify(e)}\n\n`));
        const ping = setInterval(() => res.write(': ping\n\n'), 15_000);
        req.on('close', () => {
          clearInterval(ping);
          off();
        });
        return;
      }

      if (req.method === 'GET' && route === 'file') {
        const p = url.searchParams.get('path');
        const file = p && (await safeFile(p, roots));
        if (!file) return send(res, 403, {error: 'File not found or outside .motion/ and outputs/.'});
        return await serveFile(req, res, file);
      }

      if (req.method === 'POST') return send(res, 200, await callOp(orch, route, await readJson(req)) ?? null);

      return send(res, 404, {error: `Unknown endpoint. GET /api/ops lists the operations; call one with POST /api/<op>.`});
    } catch (e) {
      const status = e instanceof OpError ? e.status : 500;
      if (!res.headersSent) send(res, status, {error: (e as Error).message});
      else res.end();
    }
  });
}

/** Start listening. Refuses non-loopback hosts unless a token is set. */
export async function serve(orch: Orchestrator, o: {port?: number; host?: string} & ServerOptions = {}) {
  const host = o.host ?? '127.0.0.1';
  const token = o.token ?? process.env.MVO_TOKEN ?? '';
  if (!LOOPBACK.has(host) && !token) {
    throw new Error(`Refusing to listen on ${host} without a token. Set MVO_TOKEN=<long random secret> (clients send "Authorization: Bearer <token>"), or use --host 127.0.0.1.`);
  }
  const server = createServer(orch, {...o, token});
  await new Promise<void>((ok, fail) => {
    server.once('error', fail);
    server.listen(o.port ?? DEFAULT_PORT, host, ok);
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : (o.port ?? DEFAULT_PORT);
  return {server, url: `http://${host.includes(':') ? `[${host}]` : host}:${port}`};
}
