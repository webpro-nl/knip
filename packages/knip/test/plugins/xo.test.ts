import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/xo');

test('Find dependencies with the xo plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['xo.config.js']['eslint-plugin-unused-imports']);
  assert(issues.unlisted['xo.config.ts']['my-shared-config']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    unlisted: 2,
    total: 2,
  });
});
