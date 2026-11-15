import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nodemon');

test('Find dependencies with the nodemon plugin', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});

test('Find commands in nodemon config files', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/nodemon-config') });
  const { issues, counters } = await main(options);

  assert(issues.files['scripts/legacy.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Find commands in nodemonConfig in package.json', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/nodemon-package-json') });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

test('Skip the nodemon config that --config or --exec replaces', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/nodemon-config-flag') });
  const { issues, counters } = await main(options);

  assert(issues.files['scripts/stale.js']);
  assert(issues.files['scripts/overridden.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 4,
    total: 4,
  });
});
