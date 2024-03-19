import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/stryker');

test('Find dependencies with the Stryker plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['@stryker-mutator/core']);
  assert(issues.unlisted['.stryker.conf.js']['@stryker-mutator/mocha-runner']);
  assert(issues.unlisted['.stryker.conf.js']['@stryker-mutator/typescript-checker']);
  assert(issues.unlisted['.stryker.conf.js']['@stryker-mutator/jasmine-framework']);
  assert(issues.unlisted['.stryker.conf.js']['@stryker-mutator/karma-runner']);
  assert(issues.unlisted['stryker.conf.cjs']['@stryker-mutator/mocha-runner']);
  assert(issues.unlisted['stryker.conf.cjs']['@stryker-mutator/typescript-checker']);
  assert(issues.unlisted['stryker.conf.cjs']['@stryker-mutator/jasmine-framework']);
  assert(issues.unlisted['stryker.conf.cjs']['@stryker-mutator/karma-runner']);
  assert(issues.unlisted['stryker.conf.json']['@stryker-mutator/karma-runner']);
  assert(issues.unlisted['stryker.conf.json']['@stryker-mutator/typescript-checker']);
  assert(issues.unlisted['stryker.conf.mjs']['@stryker-mutator/mocha-runner']);
  assert(issues.unlisted['stryker.conf.mjs']['@stryker-mutator/typescript-checker']);
  assert(issues.unlisted['stryker.conf.mjs']['@stryker-mutator/jasmine-framework']);
  assert(issues.unlisted['stryker.conf.mjs']['@stryker-mutator/karma-runner']);
  assert(issues.binaries['package.json']['stryker']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    dependencies: 1,
    unlisted: 14,
    processed: 3,
    total: 3,
  });
});
