import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/typedoc2');

test('Find dependencies with the typedoc plugin (string options)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['typedoc']);
  assert.deepEqual(Object.keys(issues.unresolved['typedoc.json'] ?? {}), []);
  assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['typedoc']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
