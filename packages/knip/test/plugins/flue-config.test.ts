import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/flue-config');

test('Find dependencies with the Flue plugin and literal custom entries', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('.flue/app.ts' in issues.files);
  assert.deepEqual(Object.keys(issues.files).sort(), ['.flue/app.ts', 'server/v/routes.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 7,
    total: 7,
  });
});
