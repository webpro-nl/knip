import test from 'node:test';
import path from 'path';
import assert from 'node:assert/strict';
import { run } from '../src/index';
import { readIgnorePatterns, negatePattern } from '../src/util/ignore';
import baseConfig from './fixtures/baseConfig';

const resolve = dir => path.resolve('test/fixtures/gitignore', dir);

test('convertPattern', () => {
  assert(negatePattern('dist'), '!dist');
  assert(negatePattern('build/*.ts'), '!build/*.ts');
});

test('readIgnorePatterns', async () => {
  const patterns = await readIgnorePatterns(resolve('.'), resolve('libs/util/type'));
  assert.deepEqual(patterns, [
    `!${resolve('libs/util/type/*.js')}`,
    `!${resolve('libs/*.ts')}`,
    `!${resolve('build')}`,
    `!${resolve('dist.ts')}`,
  ]);
});

test('ignorePatterns', async () => {
  const { issues } = await run({
    ...baseConfig,
    workingDir: resolve('.'),
    entryFiles: ['index.ts'],
    projectFiles: ['**/*'],
    ignorePatterns: [`!${resolve('dist.ts')}`, `!${resolve('build')}`],
  });

  assert.equal(issues.files.size, 0);
});

test('ignorePatterns (disabled)', async () => {
  const { issues } = await run({
    ...baseConfig,
    workingDir: resolve('.'),
    entryFiles: ['index.ts'],
    projectFiles: ['**/*'],
    ignorePatterns: [],
  });

  assert.equal(issues.files.size, 3);
});
