// The real-render test must never scaffold or roll back files in the user's working studio.
// Reuse installed dependencies, but give the pipeline its own source tree, Git refs and run store.
import assert from 'node:assert/strict';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {exec} from '../../src/pipeline/exec.ts';

export async function createPipelineFixture(sourceRepo: string, scratchRoot: string) {
  const sourceStudio = path.join(sourceRepo, 'studio');
  const dependencies = path.join(sourceStudio, 'node_modules');
  assert.ok(existsSync(dependencies), 'Install the studio dependencies before running the pipeline test.');
  mkdirSync(scratchRoot, {recursive: true});
  const repo = mkdtempSync(path.join(scratchRoot, 'pipeline-'));
  const studio = path.join(repo, 'studio');
  const linkedDependencies = path.join(studio, 'node_modules');
  const cleanup = () => {
    const relative = path.relative(path.resolve(scratchRoot), path.resolve(repo));
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Fixture cleanup escaped its scratch directory.');
    // Unlink explicitly before recursive cleanup; never traverse the shared dependency directory.
    if (existsSync(linkedDependencies)) unlinkSync(linkedDependencies);
    rmSync(repo, {recursive: true, force: true, maxRetries: 3});
  };
  try {
    // Keep the normal per-job Git proof, including its fixture commits, out of the source repository.
    const cloned = await exec('git', ['clone', '--shared', '--no-checkout', '--quiet', sourceRepo, repo], {cwd: scratchRoot});
    assert.equal(cloned.code, 0, `Cannot create isolated Git fixture: ${cloned.out}`);
    mkdirSync(path.join(studio, 'src'), {recursive: true});
    mkdirSync(path.join(studio, 'public'), {recursive: true});
    for (const file of ['package.json', 'tsconfig.json', 'remotion.config.ts'])
      copyFileSync(path.join(sourceStudio, file), path.join(studio, file));
    writeFileSync(path.join(repo, '.gitignore'), 'node_modules/\n.remotion/\n.motion/\nstudio/out/\nstudio/public/**/*.wav\noutputs/\n');
    writeFileSync(path.join(studio, 'src/index.ts'), "import {registerRoot} from 'remotion';\nimport {RemotionRoot} from './Root';\nregisterRoot(RemotionRoot);\n");
    writeFileSync(path.join(studio, 'src/Root.tsx'), "import type {FC} from 'react';\n// <mvo:imports>\nexport const RemotionRoot: FC = () => (\n  <>\n    {/* <mvo:compositions> */}\n  </>\n);\n");
    symlinkSync(dependencies, linkedDependencies, process.platform === 'win32' ? 'junction' : 'dir');
    return {repo, studio, cleanup};
  } catch (error) {
    cleanup();
    throw error;
  }
}
