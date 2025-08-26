import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/lefthook');

test('Find dependencies with the Lefthook plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['lefthook.yml']['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 1,
    total: 1,
  });
});
