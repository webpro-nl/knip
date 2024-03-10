import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/release-it');

test('Find dependencies with the Release It plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['release-it']);
  assert(issues.unlisted['.release-it.json']['@release-it/bumper']);
  assert(issues.unlisted['.release-it.json']['@release-it/conventional-changelog']);
  assert(issues.binaries['.release-it.json']['from-hook']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    unlisted: 2,
    processed: 1,
    total: 1,
  });
});
