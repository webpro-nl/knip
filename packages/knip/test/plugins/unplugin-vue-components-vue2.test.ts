import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/unplugin-vue-components-vue2');

test('Resolve Vue 2 template auto-imports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('components/AppleCard.vue' in issues.files));
  assert('components/BananaCard.vue' in issues.files);
  assert(!('formatters/formatApple.ts' in issues.files));
  assert('formatters/formatBanana.ts' in issues.files);
  assert('formatters/setValue.ts' in issues.files);
  assert(issues.dependencies['package.json']['unplugin-auto-import']);
  assert(issues.dependencies['package.json']['unplugin-vue-components']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    dependencies: 2,
    processed: 7,
    total: 7,
  });
});
