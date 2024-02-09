import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { default as husky } from '../../src/plugins/husky/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/husky-v8');
const options = buildOptions(cwd);

test('Find dependencies in husky v8 configuration (plugin)', async () => {
  const configFilePath = join(cwd, '.husky/pre-commit');
  const dependencies = await husky.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['lint-staged', 'bin:commitlint']);
});

test('Find dependencies in husky v8 configuration (main)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['.husky/pre-push']['jest']);
  assert(issues.binaries['.husky/pre-push']['pretty-quick']);
  assert(issues.binaries['.husky/pre-rebase']['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    processed: 0,
    total: 0,
  });
});
