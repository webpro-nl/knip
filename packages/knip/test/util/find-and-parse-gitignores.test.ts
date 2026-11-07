import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  findAndParseGitignores,
  getGitIgnoredHandler,
  glob,
  reconcileGitignoredPaths,
} from '../../src/util/glob-core.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

test('findAndParseGitignores', async () => {
  const cwd = resolve('fixtures/glob');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../../.gitignore', '../../../../.gitignore', '.gitignore', 'a/.gitignore', 'a/b/.gitignore'],
    ignores: new Set([
      '**/.DS_Store',
      '**/.agents',
      '**/.cache',
      '**/.claude',
      '.git/!(hooks)',
      '**/node_modules',
      'a/b/c',
      '**/.npmrc',
    ]),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (/a)', async () => {
  const cwd = resolve('fixtures/glob/a');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '../../../.gitignore', '../../../../../.gitignore', '.gitignore', 'b/.gitignore'],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      'b/c',
      '**/.DS_Store',
      '**/.agents',
      '**/.cache',
      '**/.claude',
      '**/.npmrc',
    ]),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (/a/b', async () => {
  const cwd = resolve('fixtures/glob/a/b');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: [
      '../.gitignore',
      '../../.gitignore',
      '../../../../.gitignore',
      '../../../../../../.gitignore',
      '.gitignore',
    ],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      'c',
      '**/.DS_Store',
      '**/.agents',
      '**/.cache',
      '**/.claude',
      '**/.npmrc',
    ]),
    unignores: new Set(),
  });
});

const worktreeRoot = resolve('fixtures/glob-worktree/root');
await fs.copyFile(join(worktreeRoot, 'dot-git'), join(worktreeRoot, '.git')).catch(() => {});

test('findAndParseGitignores (with .git file)', async () => {
  const cwd = resolve('fixtures/glob-worktree/root');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../mock-git-dir/info/exclude', '.gitignore', 'subdir/.gitignore'],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      '**/worktree-exclude-ignored',
      '**/worktree-ignored',
      'subdir/**/subdir-ignored',
    ]),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (with .git file in ancestor)', async () => {
  const cwd = resolve('fixtures/glob-worktree/root/subdir');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: ['../.gitignore', '.gitignore'],
    ignores: new Set(['.git/!(hooks)', '**/node_modules', '**/worktree-ignored', '**/subdir-ignored']),
    unignores: new Set(),
  });
});

test('findAndParseGitignores (negated directories)', async () => {
  const cwd = resolve('fixtures/infra/gitignore-star-negation');
  const gitignore = await findAndParseGitignores(cwd);
  assert.deepEqual(gitignore, {
    gitignoreFiles: [
      '../../../.gitignore',
      '../../../../../.gitignore',
      '.gitignore',
      'generated/keep/.gitignore',
      'generated/keep/cache/keep/.gitignore',
    ],
    ignores: new Set([
      '.git/!(hooks)',
      '**/node_modules',
      'generated/*',
      'generated/keep/cache/*',
      '**/.DS_Store',
      '**/.agents',
      '**/.cache',
      '**/.claude',
      '**/.npmrc',
    ]),
    unignores: new Set(['generated/keep', 'generated/keep/cache/keep']),
  });
});

test('findAndParseGitignores (ancestor root wildcard with unignored project)', async () => {
  const root = await fs.mkdtemp(join(tmpdir(), 'knip-gitignore-'));
  const cwd = join(root, 'app');
  try {
    await fs.mkdir(join(root, '.git'));
    await fs.mkdir(cwd);
    await fs.writeFile(join(root, '.gitignore'), '/*\n!/app/');
    await fs.writeFile(join(cwd, 'index.ts'), '');
    await fs.writeFile(join(cwd, 'orphan.ts'), '');

    const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
    const paths = await glob(['**/*.ts'], { cwd, dir: cwd, gitignore: true, label: 'project' });
    assert.deepEqual(reconcileGitignoredPaths(paths, cwd).sort(), ['index.ts', 'orphan.ts']);
    assert(!isIgnored(join(cwd, 'orphan.ts')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('findAndParseGitignores (nested explicit wildcard directories and negation)', async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), 'knip-gitignore-'));
  try {
    await fs.mkdir(join(cwd, '.git'));
    await fs.mkdir(join(cwd, 'src/packages/ui/generated'), { recursive: true });
    await fs.mkdir(join(cwd, 'src/generated'));
    await fs.writeFile(join(cwd, 'src/.gitignore'), '*/**/generated/*.ts\n!*/**/generated/keep.ts');
    await fs.writeFile(join(cwd, 'src/packages/ui/generated/types.ts'), '');
    await fs.writeFile(join(cwd, 'src/packages/ui/generated/keep.ts'), '');
    await fs.writeFile(join(cwd, 'src/generated/types.ts'), '');

    const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
    const paths = await glob(['**/*.ts'], { cwd, dir: cwd, gitignore: true, label: 'project' });
    assert.deepEqual(reconcileGitignoredPaths(paths, cwd).sort(), [
      'src/generated/types.ts',
      'src/packages/ui/generated/keep.ts',
    ]);
    assert(isIgnored(join(cwd, 'src/packages/ui/generated/types.ts')));
    assert(!isIgnored(join(cwd, 'src/packages/ui/generated/keep.ts')));
    assert(!isIgnored(join(cwd, 'src/generated/types.ts')));
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('findAndParseGitignores (anchored pattern names cwd)', async () => {
  const cwd = resolve('fixtures/infra/gitignore-ignored-cwd/app/data');
  const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
  assert.deepEqual(await glob(['**/*.ts'], { cwd, dir: cwd, gitignore: true, label: 'project' }), []);
  assert(isIgnored(join(cwd, 'nested/file.ts')));
});

test('findAndParseGitignores (unanchored pattern names cwd)', async () => {
  const cwd = resolve('fixtures/infra/gitignore-ignored-cwd/lib');
  const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
  assert.deepEqual(await glob(['**/*.ts'], { cwd, dir: cwd, gitignore: true, label: 'project' }), []);
  assert(isIgnored(join(cwd, 'nested/file.ts')));
});

test('findAndParseGitignores (negated pattern names cwd)', async () => {
  const cwd = resolve('fixtures/infra/gitignore-ignored-cwd/packages/web');
  const isIgnored = await getGitIgnoredHandler({ cwd, gitignore: true });
  assert.deepEqual(await glob(['**/*.ts'], { cwd, dir: cwd, gitignore: true, label: 'project' }), ['index.ts']);
  assert(isIgnored(join(cwd, 'debug.log')));
});
