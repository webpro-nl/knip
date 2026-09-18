import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite4');

test('Find entry from Vite index.html with custom root', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'app/module.js',
    'app/public/missing.ts',
    'app/public/unused.js',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 9,
    total: 9,
  });
});
