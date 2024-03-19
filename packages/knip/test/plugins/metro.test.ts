import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/metro');

test('Find dependencies with the metro plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/About.web.js')));
  assert(issues.files.has(join(cwd, 'src/Home.web.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    dependencies: 3,
    devDependencies: 1,
    unresolved: 2,
    processed: 14,
    total: 14,
  });
});
