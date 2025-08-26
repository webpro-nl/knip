import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/nyc');

test('Find dependencies with the nyc plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['nyc']);
  assert(issues.unresolved['.nycrc.json']['@istanbuljs/nyc-config-typescript']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unresolved: 1,
    processed: 0,
    total: 0,
  });
});
