import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest19');

test('Find dependencies with the Vitest plugin when string projects match directories and plain files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, hasConfigLoadErrors } = await main(options);

  assert(!hasConfigLoadErrors);
  assert(!issues.files['packages/core/setup.ts']);
  assert(!issues.files['packages/ui/setup.ts']);
  assert(issues.files['packages/legacy/vitest.config.ts']);
  assert(issues.files['packages/legacy/setup.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 8,
    total: 8,
  });
});
