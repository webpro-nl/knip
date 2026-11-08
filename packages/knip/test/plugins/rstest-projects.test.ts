import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rstest-projects');

test('Find dependencies and literal project configs in rstest projects', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert('root.test.ts' in issues.files);
  assert(issues.devDependencies['package.json']['@rstest/coverage-istanbul']);
  assert('packages/excluded/rstest.config.mjs' in issues.files);
  assert('packages/w/rstest.config.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 3,
    processed: 19,
    total: 19,
  });
});
