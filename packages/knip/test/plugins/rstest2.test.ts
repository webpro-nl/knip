import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/rstest2');

test('Find dependencies with the rstest plugin (2)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(issues.files.has(join(cwd, 'not-included.spec.ts')));
  assert(issues.files.has(join(cwd, 'excluded.test.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 5,
    total: 5,
  });
});
