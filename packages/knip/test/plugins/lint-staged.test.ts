import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/lint-staged');

test('Find dependencies with the lint-staged plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['prettier']);
  assert(issues.binaries['.lintstagedrc.js']['eslint']);
  assert(issues.binaries['.lintstagedrc.js']['prettier']);
  assert(issues.devDependencies['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 5,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Find dependencies with the lint-staged plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});

test('Find dependencies with the lint-staged plugin (with _comment field)', async () => {
  const cwd = resolve('fixtures/plugins/lint-staged-comment');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['.lintstagedrc.json']['eslint']);
  assert(issues.binaries['.lintstagedrc.json']['prettier']);
  assert(issues.devDependencies['package.json']['lint-staged']);

  // Should not report words from _comment as binaries
  assert(!issues.binaries['.lintstagedrc.json']?.['This']);
  assert(!issues.binaries['.lintstagedrc.json']?.['Note']);
  assert(!issues.binaries['.lintstagedrc.json']?.['changes']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 2,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
