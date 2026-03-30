import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/raycast');

test('Treat Raycast commands and tools as entries from package.json', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { counters, issues } = await main(options);

  assert(!('src/search-bookmarks.tsx' in issues.files));
  assert(!('src/shared/load-bookmarks.ts' in issues.files));
  assert(!('src/tools/organize-tabs.ts' in issues.files));
  assert('src/unused.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    total: 4,
    processed: 4,
  });
});
