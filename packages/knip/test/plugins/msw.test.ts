import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/msw');

test('Find dependencies in msw configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
  });

  assert.deepEqual(
    issues.files,
    new Set([
      join(cwd, 'public/mockServiceWorker.js'),
      join(cwd, 'src/mocks/browser.ts'),
      join(cwd, 'src/mocks/handlers.ts'),
      join(cwd, 'src/mocks/index.ts'),
      join(cwd, 'src/mocks/server.ts'),
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 5,
    total: 5,
    processed: 5,
  });
});
