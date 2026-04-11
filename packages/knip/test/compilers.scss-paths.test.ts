import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/compilers-scss-paths');

test('SCSS imports resolved via tsconfig `paths` (partial and non-partial)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.files).length, 0);
  assert.equal(Object.keys(issues.unresolved).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 4,
    total: 4,
  });
});
