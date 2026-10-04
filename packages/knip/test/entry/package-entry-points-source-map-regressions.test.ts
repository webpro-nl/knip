import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const run = async (fixture: string, options = {}) => {
  const { counters, issues, configurationHints } = await main(
    await createOptions({ cwd: resolve(`fixtures/entry/${fixture}`), ...options })
  );
  assert.deepEqual(issues.files, {});
  assert.deepEqual(issues.exports, {});
  assert.deepEqual(configurationHints, []);
  return counters;
};

test('Preserve source mapping when tsconfig files omit transitive imports', async () => {
  assert.deepEqual(await run('package-entry-points-partial-files'), {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Use the nested tsconfig directory for composite source mapping', async () => {
  assert.deepEqual(await run('package-entry-points-composite-nested', { args: { tsConfig: 'src/tsconfig.json' } }), {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
