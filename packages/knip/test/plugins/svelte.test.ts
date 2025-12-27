import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/svelte');

test('Use compilers (svelte)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@types/cookie']);
  assert(issues.devDependencies['package.json']['tslib']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 16,
    total: 16,
  });
});

test('Detect svelte.config.ts', async () => {
  const cwd = resolve('fixtures/plugins/svelte-ts');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.devDependencies['package.json']?.['@sveltejs/adapter-auto'], undefined);
  assert(issues.devDependencies['package.json']['@sveltejs/kit']);
  assert(issues.devDependencies['package.json']['svelte']);
  assert(issues.devDependencies['package.json']['vite']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 3,
    processed: 2,
    total: 2,
  });
});
