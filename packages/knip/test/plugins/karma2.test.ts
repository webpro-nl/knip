import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

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
