import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/karma2');

test('Find dependencies with the Karma plugin (test files)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.ok(issues.files.has(join(cwd, 'out-of-base-path', 'example.spec.js')));
  assert.ok(issues.files.has(join(cwd, 'src', 'excluded.spec.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 2,
    processed: 5,
    total: 5,
  });
});
