import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/unplugin-vue-components');

test('Resolve auto-imported components with the unplugin-vue-components plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // AppButton is used in App.vue's template (no explicit import); resolved via components.d.ts → not unused.
  assert(!('components/AppButton.vue' in issues.files));
  // AppCard is registered but never used in any template → still reported.
  assert('components/AppCard.vue' in issues.files);

  assert(issues.dependencies['package.json']['unplugin-vue-components']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 1,
    processed: 4,
    total: 4,
  });
});
