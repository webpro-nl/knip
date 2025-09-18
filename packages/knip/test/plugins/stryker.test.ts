import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/stryker');

test('Find dependencies with the Stryker plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['@stryker-mutator/core']);
  assert(issues.unresolved['.stryker.conf.js']['@stryker-mutator/mocha-runner']);
  assert(issues.unresolved['.stryker.conf.js']['@stryker-mutator/typescript-checker']);
  assert(issues.unresolved['.stryker.conf.js']['@stryker-mutator/jasmine-framework']);
  assert(issues.unresolved['.stryker.conf.js']['@stryker-mutator/karma-runner']);
  assert(issues.unresolved['stryker.conf.cjs']['@stryker-mutator/mocha-runner']);
  assert(issues.unresolved['stryker.conf.cjs']['@stryker-mutator/typescript-checker']);
  assert(issues.unresolved['stryker.conf.cjs']['@stryker-mutator/jasmine-framework']);
  assert(issues.unresolved['stryker.conf.cjs']['@stryker-mutator/karma-runner']);
  assert(issues.unresolved['stryker.conf.json']['@stryker-mutator/karma-runner']);
  assert(issues.unresolved['stryker.conf.json']['@stryker-mutator/typescript-checker']);
  assert(issues.unresolved['stryker.conf.mjs']['@stryker-mutator/mocha-runner']);
  assert(issues.unresolved['stryker.conf.mjs']['@stryker-mutator/typescript-checker']);
  assert(issues.unresolved['stryker.conf.mjs']['@stryker-mutator/jasmine-framework']);
  assert(issues.unresolved['stryker.conf.mjs']['@stryker-mutator/karma-runner']);
  assert(issues.binaries['package.json']['stryker']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    dependencies: 1,
    unresolved: 14,
    processed: 3,
    total: 3,
  });
});
