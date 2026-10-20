import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/tilde-name-workspace');

test('Treat a ~name workspace package as a package and an unknown ~name import as unresolved', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.unresolved['packages/app/src/index.ts']['~alias/module']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 2,
    total: 2,
  });

  assert.deepEqual(configurationHints, []);
});
