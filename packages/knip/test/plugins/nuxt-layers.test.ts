import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nuxt-layers');

test('Compile layer files with auto-import maps from the layer its own .nuxt dir', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('layers/orchard/components/BruisedApple.vue' in issues.files);
  assert(!('layers/orchard/components/FruitCard.vue' in issues.files));
  assert(!('layers/orchard/composables/useBasket.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 8,
    total: 8,
  });
});
