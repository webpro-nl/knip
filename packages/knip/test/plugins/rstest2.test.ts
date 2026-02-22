import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

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
