import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/tanstack-router');

test('Find dependencies with the tanstack-router plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['src/routes/__root.tsx']['@tanstack/router-devtools']);

  assert(issues.dependencies['package.json']['react']);
  assert(issues.dependencies['package.json']['react-dom']);
  assert(issues.devDependencies['package.json']['@tanstack/router-cli']);
  assert(issues.devDependencies['package.json']['vite']);

  assert(!issues.exports['src/routes/__root.tsx']?.['Route']);
  assert(!issues.exports['src/routes/index.tsx']?.['Route']);
  assert(!issues.exports['src/routes/posts/$postId.tsx']?.['Route']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    devDependencies: 2,
    unlisted: 1,
    processed: 4,
    total: 4,
  });
});
