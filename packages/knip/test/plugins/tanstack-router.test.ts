import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/tanstack-router');

test('Find dependencies and literal generated entries with the tanstack-router plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['src/l/tree.ts']);

  assert(issues.unlisted['src/routes/__root.tsx']['@tanstack/router-devtools']);

  assert(issues.dependencies['package.json']['react']);
  assert(issues.dependencies['package.json']['react-dom']);
  assert(issues.devDependencies['package.json']['@tanstack/router-cli']);
  assert(issues.devDependencies['package.json']['vite']);

  assert(!issues.exports['src/routes/__root.tsx']?.['Route']);
  assert(!issues.exports['src/routes/index.tsx']?.['Route']);
  assert(!issues.exports['src/routes/posts/$postId.tsx']?.['Route']);

  assert(!('src/router.tsx' in issues.files));
  assert(!('src/client.tsx' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    devDependencies: 2,
    unlisted: 1,
    files: 1,
    processed: 8,
    total: 8,
  });
});

test('Find dependencies and literal generated entries with the tanstack-router plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['src/l/tree.ts']);

  assert(!('src/router.tsx' in issues.files));
  assert(!('src/client.tsx' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    unlisted: 1,
    files: 1,
    processed: 8,
    total: 8,
  });
});
