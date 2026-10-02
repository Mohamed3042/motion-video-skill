// Runs every test/*.test.ts in its own Node process, one after another. Exit code 1 if any file fails.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

const dir = import.meta.dirname;
const files = readdirSync(dir).filter((f) => f.endsWith('.test.ts')).sort();
const failed: string[] = [];
for (const f of files) {
  console.log(`\n=== ${f}`);
  const r = spawnSync(process.execPath, [join(dir, f)], {stdio: 'inherit'});
  if (r.status !== 0) failed.push(`${f} (exit ${r.status ?? r.signal})`);
}
console.log(failed.length ? `\nFAILED: ${failed.join(', ')}` : `\nAll ${files.length} test files passed.`);
process.exit(failed.length ? 1 : 0);
