import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-plugin-pwa-no-config');

test('Report the default service worker as unused without a vite config', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('public/sw.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
