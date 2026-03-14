import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/raycast');

test('Treat Raycast commands and tools as entries from package.json', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { counters, issues } = await main(options);

  assert(!issues.files.has(join(cwd, 'src/search-bookmarks.tsx')));
  assert(!issues.files.has(join(cwd, 'src/shared/load-bookmarks.ts')));
  assert(!issues.files.has(join(cwd, 'src/tools/organize-tabs.ts')));
  assert(issues.files.has(join(cwd, 'src/unused.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    total: 1,
    processed: 1,
  });
});
