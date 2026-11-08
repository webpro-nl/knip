import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/subpath-imports-unused');

const unusedFiles = [
  'patterns/b.js',
  'unused-conditional-default.js',
  'unused-conditional-node.js',
  'unused-patterns/c.js',
  'unused.js',
];

const unusedSubpaths = ['#unused', '#unused-conditional', '#unused-patterns/*'];

const assertUnusedSubpaths = (issues: Awaited<ReturnType<typeof main>>['issues']) => {
  const subpaths = issues.subpaths['package.json'];
  assert.deepEqual(Object.keys(subpaths).sort(), unusedSubpaths);
  assert.deepEqual({ line: subpaths['#unused'].line, col: subpaths['#unused'].col }, { line: 7, col: 6 });
  assert.deepEqual(
    { line: subpaths['#unused-patterns/*'].line, col: subpaths['#unused-patterns/*'].col },
    { line: 18, col: 6 }
  );
};

test('Report unused subpath imports and their target files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), unusedFiles);
  assert(issues.unlisted['bridge/promoted.js']['unlisted-pkg']);
  assertUnusedSubpaths(issues);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 5,
    subpaths: 3,
    unlisted: 1,
    processed: 18,
    total: 18,
  });
});

test('Report unused subpath imports and their target files (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), unusedFiles);
  assert(issues.unlisted['bridge/promoted.js']['unlisted-pkg']);
  assertUnusedSubpaths(issues);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 5,
    subpaths: 3,
    unlisted: 1,
    processed: 18,
    total: 18,
  });
});
