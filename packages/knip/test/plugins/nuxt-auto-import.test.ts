import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/nuxt-auto-import');

test('Find dependencies and entries through generated definitions in .nuxt dir', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'composables/useTheme.ts')));
  assert(issues.files.has(join(cwd, 'components/StatusBadge.vue')));

  assert(issues.dependencies['package.json']['vue']);
  assert(issues.dependencies['package.json']['@vueuse/nuxt']);

  assert(issues.exports['utils/format.ts']['formatNumber']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    dependencies: 2,
    exports: 1,
    processed: 7,
    total: 11,
  });
});
