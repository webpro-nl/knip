import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-root-and-src');

test('Ignore src directory entry patterns when root pages or app directory exists', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/app/page.tsx' in issues.files);
  assert('src/pages/legacy.ts' in issues.files);
  assert(!('pages/about.tsx' in issues.files));
  assert(!('src/middleware.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 7,
    total: 7,
  });
});
