import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/js-only');

test('Find unused files and exports with only JS files', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.files.size, 1);
  assert(issues.files.has(join(cwd, 'dangling.js')));

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(Object.values(issues.exports['my-namespace.js']).length, 2);
  assert.equal(issues.exports['my-namespace.js']['MyNamespace.x'].symbol, 'x');
  assert.equal(issues.exports['my-namespace.js']['MyNamespace.z'].symbol, 'z');

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 2,
    processed: 3,
    total: 3,
  });
});
