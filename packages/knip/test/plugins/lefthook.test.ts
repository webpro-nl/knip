import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

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
