import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-negated-entry-globs');

test('Handles config file shared by multiple plugins', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/pages/_util.ts' in issues.files);
  assert('src/pages/blog/_util.ts' in issues.files);
  assert('src/pages/blog/_util/index.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 7,
    total: 7,
  });
});
