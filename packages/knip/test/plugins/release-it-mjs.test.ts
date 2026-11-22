import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/release-it-mjs');

test('Find dependencies with the Release It plugin (.release-it.mjs)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['release-it']);
  assert(issues.unlisted['.release-it.mjs']['@release-it/bumper']);
  assert(issues.binaries['.release-it.mjs']['from-hook']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});
