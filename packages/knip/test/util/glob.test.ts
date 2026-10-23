import assert from 'node:assert/strict';
import test from 'node:test';
import { _glob } from '../../src/util/glob.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsc-files-mode');

test('Return no paths when every pattern is empty or negated', async () => {
  assert.deepEqual(await _glob({ cwd, patterns: [''], gitignore: false }), []);
  assert.deepEqual(await _glob({ cwd, patterns: ['!'], gitignore: false }), []);
  assert.deepEqual(await _glob({ cwd, patterns: ['!src/**'], gitignore: false }), []);
});

test('Resolve literal patterns that exist on disk', async () => {
  const files = await _glob({ cwd, patterns: ['src/index.ts', 'src/module.ts'], gitignore: false });
  assert.deepEqual(
    files.sort(),
    [join(cwd, 'src/index.ts'), join(cwd, 'src/module.ts')].sort()
  );
});

test('Skip literal patterns that do not exist', async () => {
  assert.deepEqual(await _glob({ cwd, patterns: ['src/missing.ts'], gitignore: false }), []);
});

test('Honor negated patterns against literal matches', async () => {
  const files = await _glob({
    cwd,
    patterns: ['src/index.ts', 'src/module.ts', '!src/module.ts'],
    gitignore: false,
  });
  assert.deepEqual(files, [join(cwd, 'src/index.ts')]);
});

test('Mix literal patterns with globs', async () => {
  const files = await _glob({ cwd, patterns: ['src/index.ts', 'src/declare-*.ts'], gitignore: false });
  assert.deepEqual(
    files.sort(),
    [join(cwd, 'src/declare-global.ts'), join(cwd, 'src/declare-module.ts'), join(cwd, 'src/index.ts')].sort()
  );
});
