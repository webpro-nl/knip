import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/sitelo');

test('Find entry files with the sitelo plugin (custom pagesDir, pageExtensions and exclude)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('site/index.ht.js' in issues.files));
  assert(!('site/blog/[slug].page.ts' in issues.files));
  assert(!('site/islands/harvest-clock.js' in issues.files));
  assert(!('site/lib/layout.js' in issues.files));
  assert('site/drafts/pears.ht.js' in issues.files);
  assert('site/lib/orphan.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 7,
    total: 7,
  });
});
