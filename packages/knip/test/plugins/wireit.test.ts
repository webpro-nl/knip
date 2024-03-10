import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/wireit');

test('Find no dependencies when the wireit configuration is missing', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd: join(cwd, 'apps/missing'),
  });

  assert.deepEqual(counters, {
    ...baseCounters,
  });
});

test('Find dependencies with the wireit plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['tsc']);
  assert(issues.binaries['apps/example-configuration/package.json']['rollup']);
  assert(issues.binaries['apps/example-configuration/package.json']['tsc']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    devDependencies: 0,
    processed: 0,
    total: 0,
  });
});
