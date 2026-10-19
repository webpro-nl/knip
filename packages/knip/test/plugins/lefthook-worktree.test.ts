import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { join, toPosix } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=knip', '-c', 'user.email=knip@example.com', ...args], { cwd, stdio: 'ignore' });

const createTempDir = async (t: test.TestContext) => {
  const dir = toPosix(await fs.realpath(await fs.mkdtemp(join(toPosix(tmpdir()), 'knip-lefthook-'))));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  return dir;
};

const writeProject = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'project', devDependencies: { lefthook: '*' } })
  );
  await fs.writeFile(join(dir, 'index.js'), '');
  await fs.writeFile(join(dir, 'knip.json'), JSON.stringify({ lefthook: { entry: ['**/stray.js'] } }));
  await fs.mkdir(join(dir, 'node_modules/lefthook'), { recursive: true });
  await fs.writeFile(
    join(dir, 'node_modules/lefthook/package.json'),
    JSON.stringify({ name: 'lefthook', version: '1.0.0', bin: { lefthook: 'index.js' } })
  );
};

const runKnip = (cwd: string) => {
  const output = spawnSync(process.execPath, [resolve('src/cli.ts'), '--debug'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  const globs = output.stdout
    .split(/^\[.*?\] Finding /m)
    .slice(1)
    .map(block => block.split(/^\[/m)[0]);
  return { stdout: output.stdout, globs };
};

const installHook = async (gitDir: string) => {
  await fs.mkdir(join(gitDir, 'hooks'), { recursive: true });
  await fs.writeFile(join(gitDir, 'hooks/pre-commit'), '#!/bin/sh\nlefthook run pre-commit\n');
};

test('Lefthook hooks outside the root of a linked worktree are credited without moving the glob base', async t => {
  const dir = await createTempDir(t);
  const mainDir = join(dir, 'main');
  const worktree = join(dir, 'worktree');
  await writeProject(mainDir);
  git(mainDir, 'init');
  git(mainDir, 'add', '.');
  git(mainDir, 'commit', '-m', 'init');
  await installHook(join(mainDir, '.git'));
  git(mainDir, 'worktree', 'add', worktree);

  const { stdout, globs } = runKnip(worktree);

  assert.doesNotMatch(stdout, /Unused devDependencies/);
  const entryGlobs = globs.filter(glob => glob.includes('**/stray.js'));
  assert(entryGlobs.length > 0);
  for (const glob of entryGlobs) assert.doesNotMatch(glob, /hooks/);
});

test('Lefthook hooks in the parent of a project subfolder are credited', async t => {
  const dir = await createTempDir(t);
  const app = join(dir, 'app');
  await writeProject(app);
  git(dir, 'init');
  await installHook(join(dir, '.git'));

  const { stdout, globs } = runKnip(app);

  assert.doesNotMatch(stdout, /Unused devDependencies/);
  const entryGlobs = globs.filter(glob => glob.includes('**/stray.js'));
  assert(entryGlobs.length > 0);
  for (const glob of entryGlobs) assert.doesNotMatch(glob, /hooks/);
});
