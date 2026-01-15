import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/vitest3');

test('Find dependencies with the Vitest plugin (3)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@swc/plugin-styled-components']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-v8']);
  assert(issues.unlisted['vitest.config.ts']['jsdom']);
  assert(issues.unresolved['vitest.config.ts']['./src/setupTests.tsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 2,
    unresolved: 1,
    processed: 5,
    total: 5,
  });
});
