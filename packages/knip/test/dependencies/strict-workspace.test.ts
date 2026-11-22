import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/strict-workspace');

test('Credit ancestor, development and sibling workspace dependencies (default)', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Credit ancestor, development and sibling workspace dependencies (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Credit only own production dependencies and binaries (strict)', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.unlisted['packages/app/index.ts']).sort(), [
    '@fixtures/strict-workspace__lib',
    'own-dev-dependency',
    'root-dependency',
  ]);
  assert.deepEqual(Object.keys(issues.binaries['packages/app/package.json']), ['root-binary']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 3,
    binaries: 1,
    processed: 3,
    total: 3,
  });
});
