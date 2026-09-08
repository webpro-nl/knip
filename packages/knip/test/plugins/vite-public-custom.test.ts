import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-public-custom');

test('Resolve Vite publicDir relative to root', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['app/module.js', 'app/public/classic.js', 'assets/unused.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 6,
    total: 6,
  });
});
