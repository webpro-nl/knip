import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/ava3');

test('Find dependencies with the Ava plugin (3)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'test.js')));
  assert(issues.files.has(join(cwd, 'test.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 9,
    total: 9,
  });
});
