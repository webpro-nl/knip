import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/playwright5');

test('Find webServer commands in their cwd with the Playwright plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['service/specs/skip.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 4,
    total: 4,
  });
});
