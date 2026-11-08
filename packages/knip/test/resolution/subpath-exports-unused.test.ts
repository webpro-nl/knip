import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/subpath-exports-unused');

const unusedFiles = [
  'packages/lib/patterns/b.js',
  'packages/lib/unused-default.js',
  'packages/lib/unused-node.js',
  'packages/lib/unused-patterns/c.js',
  'packages/lib/unused.js',
  'packages/unused/lib.js',
];

test('Report unused subpath exports of workspaces with includeSubpathExports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), unusedFiles);

  const lib = issues.subpaths['packages/lib/package.json'];
  assert.deepEqual(Object.keys(lib).sort(), ['./unused', './unused-conditional', './unused-patterns/*']);
  assert.deepEqual({ line: lib['./unused'].line, col: lib['./unused'].col }, { line: 9, col: 6 });

  const unused = issues.subpaths['packages/unused/package.json'];
  assert.deepEqual(Object.keys(unused), ['.']);
  assert.deepEqual({ line: unused['.'].line, col: unused['.'].col }, { line: 3, col: 4 });

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 6,
    subpaths: 4,
    processed: 16,
    total: 16,
  });
});

test('Report unused subpath exports of all workspaces with --include-subpath-exports', async () => {
  const options = await createOptions({ cwd, isIncludeSubpathExports: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), unusedFiles);
  assert.deepEqual(Object.keys(issues.subpaths['packages/public/package.json']), ['.']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 6,
    subpaths: 5,
    processed: 16,
    total: 16,
  });
});

test('Include the workspace a package alias refers to when filtering workspaces', async () => {
  const options = await createOptions({ cwd, workspace: 'packages/other' });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Treat subpath exports as public in strict mode with a workspace filter', async () => {
  const options = await createOptions({ cwd, isStrict: true, workspace: 'packages/lib' });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 11,
    total: 11,
  });
});
