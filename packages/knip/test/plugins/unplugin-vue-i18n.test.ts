import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/unplugin-vue-i18n');

test('Handle the messages virtual module with the @intlify/unplugin-vue-i18n plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  // The `@intlify/unplugin-vue-i18n/messages` virtual module is not reported as an unlisted dependency (counters verify
  // 0 unlisted), and the base package is credited via the same import.
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
