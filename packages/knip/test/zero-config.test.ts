import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/zero-config');

test('Find unused exports in zero-config mode', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);

  assert.equal(Object.values(issues.exports).length, 2);
  assert.equal(issues.exports['my-module.ts']['unused'].symbol, 'unused');
  assert.equal(issues.exports['my-module.ts']['default'].symbol, 'default');
  assert.equal(issues.exports['my-namespace.ts']['MyNamespace.z'].symbol, 'z');
  assert(!issues.exports['index.ts']);

  assert.equal(Object.values(issues.types).length, 2);
  assert.equal(issues.types['my-module.ts']['AnyType'].symbolType, 'type');
  assert.equal(issues.types['my-namespace.ts']['MyNamespace.NS'].symbol, 'NS');

  assert.equal(Object.values(issues.duplicates).length, 1);
  assert.equal(issues.duplicates['my-module.ts']['myExport|default'].symbols?.length, 2);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 3,
    types: 2,
    duplicates: 1,
    processed: 4,
    total: 4,
  });
});
