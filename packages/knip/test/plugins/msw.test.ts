import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/msw');

test('Should not see the msw files in issues', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
  });

  assert.equal(issues.files.size, 3);
  assert(issues.files.has(join(cwd, 'junk.js')));
  assert(issues.files.has(join(cwd, 'mocks/junk.js')));
  assert(issues.files.has(join(cwd, 'src/mocks/junk.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 3,
    total: 13,
    processed: 13,
  });
});
