import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/unplugin-vue-markdown');

test('Resolve component tags in Markdown with the unplugin-vue-markdown plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // DocCard is used in the Markdown prose → resolved, not unused.
  assert(!('components/DocCard.vue' in issues.files));
  // DocFenced only appears inside a fenced code block (an example) → not a real usage, still reported.
  assert('components/DocFenced.vue' in issues.files);
  // DocUnused is never referenced → reported.
  assert('components/DocUnused.vue' in issues.files);

  assert(issues.dependencies['package.json']['unplugin-vue-markdown']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    dependencies: 3,
    processed: 5,
    total: 5,
  });
});
