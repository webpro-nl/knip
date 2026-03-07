import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { join } from '../src/util/path.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-negated-entry-globs');

test('Handles config file shared by multiple plugins', async () => {
  const options = await createOptions({ cwd, isIsolateWorkspaces: true });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'src/pages/_util.ts')));
  assert(issues.files.has(join(cwd, 'src/pages/blog/_util.ts')));
  assert(issues.files.has(join(cwd, 'src/pages/blog/_util/index.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 7,
    total: 7,
  });
});
