import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/playwright');

test('Find dependencies with the Playwright plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['setup/b/prepare.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 11,
    total: 11,
  });
});

test('Keep literal Playwright setup paths out of production', async () => {
  const { issues } = await main(await createOptions({ cwd, isProduction: true }));
  assert(issues.files['setup/b/prepare.ts']);
  assert(!issues.files['setup/[browser]/prepare.ts']);
});
