import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/vitest9');

test('Find dependencies in vitest configuration (projects with inline and external)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['vitest.config.ts']['jsdom']);
  assert(issues.unlisted['packages/client/vitest.config.e2e.ts']['happy-dom']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    devDependencies: 0,
    unlisted: 2,
    unresolved: 0,
    processed: 6,
    total: 6,
  });
});
