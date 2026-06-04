import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find unused exports respecting ignoreExportsUsedInFile: false', async () => {
  const cwd = resolve('fixtures/ignore-exports-used-in-file/false');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['imported.ts']['default'].symbol, 'default');
  assert.equal(issues.exports['imported.ts']['DeclaredThenExportedNamed'].symbol, 'DeclaredThenExportedNamed');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 2,
    total: 2,
  });
});
