import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/wireit');

test('Find no dependencies when the wireit configuration is missing', async () => {
  const options = await createOptions({ cwd: join(cwd, 'apps/missing') });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
  });
});

test('Find dependencies with the wireit plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
