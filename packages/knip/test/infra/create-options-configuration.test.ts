import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/create-options-configuration');

test('Ignore config file and package.json#knip when configuration is provided', async () => {
  const options = await createOptions({
    cwd,
    configuration: { workspaces: { 'packages/*': { entry: ['petals.ts'] } } },
  });

  assert.equal(options.configFilePath, undefined);
  assert.deepEqual(options.workspaces, ['packages/*']);

  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['weed.ts', 'knip.config.js']);
  assert.equal(issues.exports['packages/flower-garden/stems.ts']['stemColor'].symbol, 'stemColor');
  assert(!issues.exports['packages/flower-garden/petals.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    exports: 1,
    processed: 5,
    total: 5,
  });
});
