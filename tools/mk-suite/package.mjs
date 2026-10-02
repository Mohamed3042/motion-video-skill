// Produce the complete MK Suite V1 + V2 editable source archive using an isolated Git index.
// Usage: node tools/mk-suite/package.mjs [--check]
// --check is read-only: it validates source completeness, imports, audio and publication hygiene.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archiveRel = 'outputs/mk-suite-workflows/MK-Suite-Workflows-Source.zip';
const auditRel = 'docs/mk-suite/package-audit.json';
const versions = ['mk-suite-worlds', 'mk-suite-workflows'];
const requiredFiles = [
  'package.json', 'README.md', 'AGENTS.md', 'LICENSE',
  'briefs/mk-suite-23.plan.json', 'briefs/mk-suite-worlds.md',
  'briefs/mk-suite-workflows.plan.json', 'briefs/mk-suite-workflows.md',
  'skills/motion-video/SKILL.md', 'studio/package.json', 'studio/package-lock.json',
  'studio/tsconfig.json', 'studio/remotion.config.ts',
  'production-review.mjs', 'production-video-qc.mjs', 'production-delivery.mjs',
  'production-report.mjs', 'production-package.mjs',
  ...versions.map(slug => `studio/public/${slug}/music.wav`),
];
const approvedDirs = ['docs/mk-suite', 'tools/mk-suite',
  ...versions.flatMap(slug => [`studio/src/${slug}`, `studio/scripts/${slug}`])];
const posix = value => value.split(path.sep).join('/');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8').replace(/^\uFEFF/, ''));
const insist = (ok, message) => {if (!ok) throw new Error(message);};

function listFiles() {
  const files = new Set(requiredFiles);
  const walk = rel => {
    for (const item of fs.readdirSync(path.join(root, rel), {withFileTypes: true})) {
      const name = `${rel}/${item.name}`;
      insist(!item.isSymbolicLink(), `Refusing symbolic link: ${name}`);
      if (item.isDirectory()) walk(name); else if (item.isFile()) files.add(name);
    }
  };
  for (const dir of approvedDirs) {insist(fs.existsSync(path.join(root, dir)), `Missing required directory: ${dir}`); walk(dir);}
  for (const rel of files) {
    insist(!/[\r\n\0]/.test(rel) && !rel.startsWith('/') && !rel.split('/').includes('..'), `Unsafe package path: ${rel}`);
    const full = path.join(root, rel), stat = fs.lstatSync(full);
    insist(stat.isFile() && !stat.isSymbolicLink(), `Not a regular source file: ${rel}`);
    insist(!/(^|\/)(node_modules|\.git|\.motion|\.env(?:\.|$)|credentials|private|owner-data|profiles)(\/|$)/i.test(rel), `Excluded private/generated path: ${rel}`);
    insist(!/\.(pem|key|pfx|p12|sqlite|db)$/i.test(rel), `Excluded key/database file: ${rel}`);
  }
  return [...files].sort();
}

function wavInfo(rel) {
  const data = fs.readFileSync(path.join(root, rel));
  insist(data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WAVE', `Not a RIFF WAV: ${rel}`);
  let format, bytes;
  for (let at = 12; at + 8 <= data.length;) {
    const tag = data.toString('ascii', at, at + 4), size = data.readUInt32LE(at + 4), body = at + 8;
    insist(body + size <= data.length, `Truncated WAV chunk: ${rel}`);
    if (tag === 'fmt ') format = {encoding: data.readUInt16LE(body), channels: data.readUInt16LE(body + 2), sampleRate: data.readUInt32LE(body + 4), byteRate: data.readUInt32LE(body + 8), bits: data.readUInt16LE(body + 14)};
    if (tag === 'data') bytes = size;
    at = body + size + (size % 2);
  }
  insist(format && bytes !== undefined, `Missing WAV format/data: ${rel}`);
  const seconds = bytes / format.byteRate;
  insist(format.encoding === 1 && format.channels === 2 && format.sampleRate === 44100 && format.bits === 16 && seconds === 90, `Unexpected soundtrack format/duration: ${rel}`);
  return {path: rel, seconds, channels: format.channels, sampleRate: format.sampleRate, bits: format.bits};
}

function verifySource(files) {
  const fileSet = new Set(files), missingImports = [], hygiene = [], dependencies = new Set();
  let relativeImportsChecked = 0;
  const manifest = files.filter(rel => rel !== auditRel).map(rel => ({path: rel, bytes: fs.statSync(path.join(root, rel)).size, sha256: hash(fs.readFileSync(path.join(root, rel)))}));
  for (const rel of files.filter(p => /\.(?:[cm]?[jt]sx?|json|md)$/.test(p))) {
    const source = fs.readFileSync(path.join(root, rel), 'utf8');
    if (/\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) hygiene.push({path: rel, issue: 'Credential-shaped content'});
    for (const m of source.matchAll(/\b[A-Za-z]:[\\/]+Users[\\/]+([^\\/\s"'`]+)|\/(?:home|Users)\/([^/\s"'`]+)/g)) {
      const username = m[1] ?? m[2];
      if (!/^(?:<[^>]+>|you|user|username|example)$/i.test(username)) hygiene.push({path: rel, issue: 'Absolute owner home path'});
    }
    if (!/\.[cm]?[jt]sx?$/.test(rel)) continue;
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g)) {
      const spec = match[1];
      if (!spec.startsWith('.')) {if (!spec.startsWith('node:')) dependencies.add(spec); continue;}
      const resolved = posix(path.relative(root, path.resolve(path.dirname(path.join(root, rel)), spec)));
      if (resolved.startsWith('studio/node_modules/')) {dependencies.add(resolved.slice('studio/node_modules/'.length).split('/dist/')[0]); continue;}
      relativeImportsChecked++;
      const candidates = [resolved, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}.js`, `${resolved}.mjs`, `${resolved}/index.ts`, `${resolved}/index.tsx`];
      if (!candidates.some(candidate => fileSet.has(candidate))) missingImports.push({path: rel, import: spec});
    }
  }
  insist(hygiene.length === 0, `Source hygiene failed: ${JSON.stringify(hygiene)}`);
  insist(missingImports.length === 0, `Unresolved packaged imports: ${JSON.stringify(missingImports)}`);
  const compositionCounts = versions.map((slug, i) => {
    const plan = readJson(i ? 'briefs/mk-suite-workflows.plan.json' : 'briefs/mk-suite-23.plan.json');
    insist(plan.segments.length === 23, `Expected 23 scenes for ${slug}`);
    for (const scene of plan.segments) for (const needed of [`studio/src/${slug}/segments/${scene.id}/World.tsx`, `studio/src/${slug}/segments/${scene.id}/timing.ts`, `studio/scripts/${slug}/segments/${scene.id}.ts`]) insist(fileSet.has(needed), `Missing scene source: ${needed}`);
    for (const needed of [`studio/src/${slug}/entry.ts`, `studio/src/${slug}/Root.tsx`]) insist(fileSet.has(needed), `Missing standalone entry: ${needed}`);
    return {slug, worlds: 23, timingModules: 23, audioModules: 23};
  });
  insist(!fileSet.has('studio/src/Root.tsx'), 'Global Root.tsx must not be in the source archive');
  const lock = readJson('studio/package-lock.json');
  for (const name of ['react', 'remotion', '@remotion/cli', '@remotion/bundler', '@remotion/renderer', '@remotion/google-fonts', 'typescript']) insist(lock.packages?.[`node_modules/${name}`], `Dependency missing from lockfile: ${name}`);
  const audio = versions.map(slug => wavInfo(`studio/public/${slug}/music.wav`));
  return {compositionCounts, relativeImportsChecked, missingImports, hygiene, dependencies: [...dependencies].sort(), audio, manifest};
}

function git(args, options = {}) {
  const result = spawnSync('git', args, {cwd: root, windowsHide: true, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...options});
  if (result.error) throw result.error;
  insist(result.status === 0, `git ${args[0]} failed: ${(result.stderr ?? '').toString().trim()}`);
  return result.stdout;
}

// Read ZIP central directory + inflate each entry. This audits the finished archive without extracting it.
function verifyArchive(file, files) {
  const zip = fs.readFileSync(file); let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) if (zip.readUInt32LE(i) === 0x06054b50) {end = i; break;}
  insist(end >= 0, 'ZIP end-of-directory not found');
  const count = zip.readUInt16LE(end + 10); let cursor = zip.readUInt32LE(end + 16);
  const expected = new Set(files), seen = new Set();
  for (let i = 0; i < count; i++) {
    insist(zip.readUInt32LE(cursor) === 0x02014b50, 'Invalid ZIP central directory');
    const method = zip.readUInt16LE(cursor + 10), compressed = zip.readUInt32LE(cursor + 20), size = zip.readUInt32LE(cursor + 24), nameLen = zip.readUInt16LE(cursor + 28), extra = zip.readUInt16LE(cursor + 30), comment = zip.readUInt16LE(cursor + 32), local = zip.readUInt32LE(cursor + 42);
    const name = zip.toString('utf8', cursor + 46, cursor + 46 + nameLen);
    cursor += 46 + nameLen + extra + comment;
    if (name.endsWith('/')) continue;
    insist(expected.has(name) && !seen.has(name), `Unexpected/duplicate ZIP entry: ${name}`); seen.add(name);
    insist(zip.readUInt32LE(local) === 0x04034b50, `Invalid ZIP local header: ${name}`);
    const body = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const payload = zip.subarray(body, body + compressed);
    insist(method === 0 || method === 8, `Unsupported ZIP compression: ${name}`);
    const raw = method === 8 ? inflateRawSync(payload) : payload;
    insist(raw.length === size && hash(raw) === hash(fs.readFileSync(path.join(root, name))), `ZIP content differs from source: ${name}`);
  }
  insist(seen.size === files.length, `ZIP file count mismatch: ${seen.size} / ${files.length}`);
  return {filesVerified: seen.size, entryNamesMatchAllowlist: true, allContentHashesMatchSource: true};
}

const args = process.argv.slice(2);
insist(args.every(arg => arg === '--check'), 'Usage: node tools/mk-suite/package.mjs [--check]');
let files = listFiles();
let evidence = verifySource(files);
if (args.includes('--check')) {
  console.log(JSON.stringify({status: 'source-check-passed', files: files.length, compositionCounts: evidence.compositionCounts, relativeImportsChecked: evidence.relativeImportsChecked, audio: evidence.audio}, null, 2));
} else {
  const beforeHead = git(['rev-parse', 'HEAD']).trim();
  const beforeBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  const realIndex = path.resolve(root, git(['rev-parse', '--git-path', 'index']).trim());
  const beforeIndex = fs.existsSync(realIndex) ? hash(fs.readFileSync(realIndex)) : null;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-suite-package-'));
  const index = path.join(temp, 'index');
  const env = {...process.env, GIT_INDEX_FILE: index};
  const output = path.join(root, archiveRel), pending = path.join(path.dirname(output), '.MK-Suite-Workflows-Source.pending.zip');
  fs.mkdirSync(path.dirname(output), {recursive: true});
  const report = {schemaVersion: 1, status: 'source-verified-awaiting-archive', archive: archiveRel,
    scope: 'Complete editable MK Suite V1 and V2. Exact allowlist; no product-private data or orchestration session state.',
    manifestNote: 'The audit excludes its own content hash and the ZIP hash to avoid circular digests.',
    ...evidence, archiveVerification: null};
  const saveReport = () => fs.writeFileSync(path.join(root, auditRel), JSON.stringify(report, null, 2) + '\n');
  const archive = () => {
    files = listFiles();
    git(['read-tree', '--empty'], {env});
    git(['add', '-f', '--pathspec-from-file=-', '--pathspec-file-nul'], {env, input: files.join('\0') + '\0'});
    // Git attributes may normalize CRLF. Override only the temporary index with unfiltered blobs so
    // every archived byte matches the working source, on Windows and Linux alike.
    const staged = new Map(git(['ls-files', '--stage', '-z'], {env}).split('\0').filter(Boolean).map(line => {const cut = line.indexOf('\t'); return [line.slice(cut + 1), line.slice(0, cut).split(' ')[0]];}));
    const records = [];
    for (let at = 0; at < files.length; at += 24) {
      const group = files.slice(at, at + 24);
      const ids = git(['hash-object', '-w', '--no-filters', '--', ...group], {env}).trim().split(/\r?\n/);
      insist(ids.length === group.length, 'git hash-object returned an unexpected count');
      group.forEach((rel, i) => records.push(`${staged.get(rel) ?? '100644'} ${ids[i]}\t${rel}\0`));
    }
    git(['update-index', '-z', '--index-info'], {env, input: records.join('')});
    const tree = git(['write-tree'], {env}).trim();
    // A user-level core.autocrlf setting can also transform archive output because this
    // deliberately minimal tree has no repository-wide .gitattributes. Keep stored bytes.
    git(['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'archive', '--format=zip', '--output', pending, tree], {env});
    return verifyArchive(pending, files);
  };
  try {
    saveReport();
    report.archiveVerification = archive();
    report.status = 'passed';
    report.packagedFileCount = files.length;
    saveReport();
    archive(); // Include the successful audit, then verify every final ZIP entry again.
    insist(git(['rev-parse', 'HEAD']).trim() === beforeHead && git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() === beforeBranch, 'Repository branch/HEAD changed during packaging');
    insist((fs.existsSync(realIndex) ? hash(fs.readFileSync(realIndex)) : null) === beforeIndex, 'Real Git index changed during packaging');
    fs.renameSync(pending, output);
    console.log(JSON.stringify({status: 'passed', archive: archiveRel, audit: auditRel, files: files.length, worlds: 46, bytes: fs.statSync(output).size, sha256: hash(fs.readFileSync(output)), realIndexUnchanged: true, branchUnchanged: true}, null, 2));
  } catch (error) {
    report.status = 'failed'; report.failure = String(error.message).replaceAll(root, '<workspace>'); saveReport();
    throw error;
  } finally {
    // The resolved target was created by mkdtemp under the system temporary directory above.
    insist(path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith('mk-suite-package-'), 'Unexpected temporary cleanup path');
    fs.rmSync(temp, {recursive: true, force: true});
    if (fs.existsSync(pending)) fs.rmSync(pending);
  }
}
