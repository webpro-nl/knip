import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Exclude files behind a null package entry point', async () => {
  const cwd = resolve('fixtures/entry/package-entry-points-null-subpath');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/internal/orphan.ts' in issues.files);
  assert(issues.exports['src/internal/format.ts']?.['formatLoud']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});

test('Exclude source files behind a null package entry point with a dist target', async () => {
  const cwd = resolve('fixtures/entry/package-entry-points-null-subpath-dist');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/internal/orphan.ts' in issues.files);
  assert(issues.exports['src/internal/format.ts']?.['formatLoud']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});

test('Include files re-exported below a null package entry point', async () => {
  const cwd = resolve('fixtures/entry/package-entry-points-null-subpath-exported');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/internal/public.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Exclude files behind null package entry points with subpath suffixes', async () => {
  const cwd = resolve('fixtures/entry/package-entry-points-null-subpath-suffix');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/features/format.test.js' in issues.files);
  assert('src/features/legacy.js' in issues.files);
  assert('src/features/private-internal/helper.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 5,
    total: 5,
  });
});

test('Keep manifest entries that a null package entry point would hide', async () => {
  const cwd = resolve('fixtures/entry/package-entry-points-null-subpath-bin');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.files, {});

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
