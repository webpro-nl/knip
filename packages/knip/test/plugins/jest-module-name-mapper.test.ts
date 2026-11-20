import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-module-name-mapper');

test('Find unused exports with the Jest plugin (moduleNameMapper)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 3,
    total: 3,
  });
});

test('Find unused exports with the Jest plugin (moduleNameMapper, production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.equal(issues.exports['src/lib/name.ts']?.NAME, undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
