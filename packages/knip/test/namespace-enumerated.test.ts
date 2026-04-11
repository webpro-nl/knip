import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/namespace-enumerated');

test('Consider namespace import members used when enumerated via Object.*', async () => {
  const options = await createOptions({ cwd, includedIssueTypes: ['nsExports'] });
  const { issues, counters } = await main(options);

  assert.equal(issues.nsExports['colors.ts'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
