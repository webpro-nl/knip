import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/webpack-entry-import');

test('Resolve Webpack entry descriptors using the import field', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/main.js' in issues.files));
  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 2,
    total: 2,
  });
});
