import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-plugin-pwa');

test('Mark the injectManifest service worker as an entry with the vite-plugin-pwa plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // The custom service worker (injectManifest srcDir/filename) has no importer → marked as a production entry.
  assert(!('src/sw.ts' in issues.files));
  // An unrelated module is still reported.
  assert('src/orphan.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
