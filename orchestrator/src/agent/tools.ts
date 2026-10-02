// Sandboxed tools for a worker model. Paths resolve inside studioRoot only (prefix + realpath check, so `../`,
// absolute paths elsewhere, other drives and symlinks out are refused); node_modules is off limits; writes need an
// `allow` glob; commands need a commandAllow match. Tool errors come back as text (the model can react), never throws.
import {spawn} from 'node:child_process';
import {existsSync, realpathSync} from 'node:fs';
import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, extname, isAbsolute, relative, resolve, sep} from 'node:path';
import type {ContentPart, ToolDef} from '../types.ts';

export type ToolRun = {text: string; images?: ContentPart[]; finished?: boolean};

// Glob → RegExp: `**` any depth (incl. none), `*` within a segment, `?` one char. Paths use '/'.
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === '*' && glob[i + 1] === '*') {
      i++;
      if (glob[i + 1] === '/') {
        i++;
        re += '(?:.*/)?';
      } else re += '.*';
    } else if (ch === '*') re += '[^/]*';
    else if (ch === '?') re += '[^/]';
    else re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
export const matchGlob = (glob: string, relPath: string): boolean => globToRegExp(glob.replace(/\\/g, '/').replace(/^\.\//, '')).test(relPath);

const IMAGE_MIME: Record<string, string> = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif'};
const SKIP_DIRS = new Set(['node_modules', '.git']);
const SHELL_OPS = /[;&|`<>\r\n]|\$\(/;
const SECRET_ENV = /API_KEY|_TOKEN|SECRET|PASSWORD/i;
const COMMAND_TIMEOUT = 30 * 60_000;
const tail = (s: string, n = 20_000) => (s.length > n ? `…(truncated)…\n${s.slice(-n)}` : s);

const str = (d: string) => ({type: 'string', description: d});
const def = (name: string, description: string, props: Record<string, object>, required = Object.keys(props)): ToolDef => ({
  name,
  description,
  parameters: {type: 'object', properties: props, required},
});

export function makeTools(o: {studioRoot: string; allow: string[]; commandAllow: RegExp[]; vision: boolean}): {
  defs: ToolDef[];
  run(name: string, args: any): Promise<ToolRun>;
} {
  const root = resolve(o.studioRoot);
  const realRoot = existsSync(root) ? realpathSync(root) : root;
  const allowText = o.allow.length ? o.allow.join(', ') : '(none: this job may not write files)';

  const within = (base: string, p: string) => {
    const rel = relative(base, p);
    return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
  };
  // → {abs, rel} or throws a message for the model
  const locate = (p: unknown) => {
    if (typeof p !== 'string' || !p.trim()) throw new Error('path is required');
    const abs = resolve(root, p);
    if (!within(root, abs)) throw new Error(`"${p}" is outside the studio root; use paths relative to it`);
    let existing = abs; // follow symlinks of the nearest existing ancestor
    while (!existsSync(existing) && dirname(existing) !== existing) existing = dirname(existing);
    if (!within(realRoot, realpathSync(existing))) throw new Error(`"${p}" resolves outside the studio root`);
    const rel = relative(root, abs).split(sep).join('/');
    if (rel.split('/').includes('node_modules')) throw new Error('node_modules is off limits');
    return {abs, rel};
  };
  const writable = (p: unknown) => {
    const loc = locate(p);
    if (!o.allow.some((g) => matchGlob(g, loc.rel))) throw new Error(`writing "${loc.rel}" is not allowed. This job may only write files matching: ${allowText}`);
    return loc;
  };

  async function walk(dirAbs: string, out: string[], max: number) {
    for (const e of await readdir(dirAbs, {withFileTypes: true}).catch(() => [])) {
      if (out.length >= max) return;
      const abs = resolve(dirAbs, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) await walk(abs, out, max);
      } else out.push(relative(root, abs).split(sep).join('/'));
    }
  }

  function runCommand(command: string): Promise<string> {
    return new Promise((done) => {
      const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !SECRET_ENV.test(k)));
      const child = spawn(command, {cwd: root, shell: true, env, windowsHide: true, detached: process.platform !== 'win32'});
      let out = '';
      const onData = (d: Buffer) => {
        out += d.toString();
        if (out.length > 200_000) out = out.slice(-100_000);
      };
      child.stdout?.on('data', onData);
      child.stderr?.on('data', onData);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {windowsHide: true});
          else if (child.pid) process.kill(-child.pid, 'SIGKILL'); // whole process group
        } catch {}
      }, COMMAND_TIMEOUT);
      child.on('error', (e) => out += `\n${e.message}`);
      child.on('close', (code, signal) => {
        clearTimeout(timer);
        done(tail(`exit ${code ?? signal}${timedOut ? ' (timed out after 30 min)' : ''}\n${out}`));
      });
    });
  }

  const defs: ToolDef[] = [
    def('read_file', 'Read a UTF-8 text file (path relative to the studio root).', {path: str('file path')}),
    def('list_files', 'List files under a directory, or matching a glob such as "src/**/*.tsx" (node_modules is skipped).', {pattern: str('directory or glob; "." for everything')}),
    def('write_file', `Create or overwrite a text file. Allowed paths: ${allowText}`, {path: str('file path'), content: str('full file content')}),
    def(
      'edit_file',
      `Replace an exact string in a file (must be unique unless replace_all). Allowed paths: ${allowText}`,
      {path: str('file path'), old: str('exact text to replace'), new: str('replacement text'), replace_all: {type: 'boolean', description: 'replace every occurrence'}},
      ['path', 'old', 'new'],
    ),
    def('run_command', 'Run an allowed shell command in the studio root. Returns the exit code and the tail of the output.', {command: str('command line')}),
    ...(o.vision ? [def('view_image', 'Look at a PNG/JPG/WebP image (e.g. a rendered still).', {path: str('image path')})] : []),
    def('finish', 'Call when the job is done (or cannot be done), with a short summary of what you did.', {summary: str('summary')}),
  ];

  async function run(name: string, a: any): Promise<ToolRun> {
    a ??= {};
    switch (name) {
      case 'read_file': {
        const {abs} = locate(a.path);
        const text = await readFile(abs, 'utf8');
        return {text: text.length > 100_000 ? `${text.slice(0, 100_000)}\n…(truncated at 100000 chars)` : text};
      }
      case 'list_files': {
        const pattern = String(a.pattern ?? a.path ?? '.').replace(/\\/g, '/');
        const segs = pattern.split('/');
        const g = segs.findIndex((s) => /[*?]/.test(s)); // first glob segment; walk only the fixed prefix
        const {abs, rel} = locate(g < 0 ? pattern : segs.slice(0, g).join('/') || '.');
        const files: string[] = [];
        await walk(abs, files, 20_000);
        const glob = [rel, ...segs.slice(g)].filter(Boolean).join('/');
        const hits = g < 0 ? files : files.filter((f) => matchGlob(glob, f));
        const shown = hits.slice(0, 1000);
        return {text: shown.length ? shown.join('\n') + (hits.length > shown.length ? `\n…(${hits.length - shown.length} more)` : '') : '(no files)'};
      }
      case 'write_file': {
        const {abs, rel} = writable(a.path);
        if (typeof a.content !== 'string') return {text: 'Error: content must be a string'};
        await mkdir(dirname(abs), {recursive: true});
        await writeFile(abs, a.content);
        return {text: `wrote ${rel} (${a.content.length} chars)`};
      }
      case 'edit_file': {
        const {abs, rel} = writable(a.path);
        if (typeof a.old !== 'string' || !a.old || typeof a.new !== 'string') return {text: 'Error: old (non-empty) and new must be strings'};
        const text = await readFile(abs, 'utf8');
        const n = text.split(a.old).length - 1;
        if (n === 0) return {text: `Error: old text not found in ${rel}`};
        if (n > 1 && !a.replace_all) return {text: `Error: old text occurs ${n} times in ${rel}; add context to make it unique or set replace_all`};
        const i = text.indexOf(a.old);
        await writeFile(abs, a.replace_all ? text.split(a.old).join(a.new) : text.slice(0, i) + a.new + text.slice(i + a.old.length));
        return {text: `edited ${rel} (${a.replace_all ? n : 1} replacement${(a.replace_all ? n : 1) > 1 ? 's' : ''})`};
      }
      case 'run_command': {
        const command = String(a.command ?? '').trim();
        if (!command) return {text: 'Error: command is required'};
        if (SHELL_OPS.test(command)) return {text: 'Error: shell operators (; & | ` < > $( newlines) are not allowed; run one command at a time'};
        if (!o.commandAllow.some((re) => re.test(command)))
          return {text: `Error: command not allowed. Allowed patterns: ${o.commandAllow.map(String).join(', ') || '(none)'}`};
        return {text: await runCommand(command)};
      }
      case 'view_image': {
        if (!o.vision) return {text: 'Error: this model cannot view images'};
        const {abs, rel} = locate(a.path);
        const mime = IMAGE_MIME[extname(abs).toLowerCase()];
        if (!mime) return {text: `Error: unsupported image type ${extname(abs) || '(none)'}; use png, jpg, webp or gif`};
        const url = `data:${mime};base64,${(await readFile(abs)).toString('base64')}`;
        return {text: 'The image is attached in the next message.', images: [{type: 'text', text: `Image: ${rel}`}, {type: 'image_url', image_url: {url}}]};
      }
      case 'finish':
        return {text: String(a.summary ?? ''), finished: true};
      default:
        return {text: `Error: unknown tool "${name}". Available: ${defs.map((d) => d.name).join(', ')}`};
    }
  }

  return {
    defs,
    run: (name, args) => run(name, args).catch((e: Error) => ({text: `Error: ${e.message}`})),
  };
}
