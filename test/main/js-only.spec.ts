import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

test('Find unused files and exports with JS entry file', async () => {
  const cwd = 'test/fixtures/js-only';

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert.equal(issues.files.size, 1);
  assert(Array.from(issues.files)[0].endsWith('dangling.js'));

  assert.equal(Object.values(issues.exports).length, 1);
  assert.equal(issues.exports['index.js']['b'].symbol, 'b');

  assert.equal(Object.values(issues.nsExports['my-namespace.js']).length, 2);
  assert.equal(issues.nsExports['my-namespace.js']['x'].symbol, 'x');
  assert.equal(issues.nsExports['my-namespace.js']['z'].symbol, 'z');

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 1,
    nsExports: 2,
    processed: 3,
    total: 3,
  });
});
