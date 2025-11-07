import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/typescript');

test('Find dependencies with the TypeScript plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['tsconfig.json']['typescript-eslint-language-service']);
  assert(issues.unresolved['tsconfig.json']['ts-graphql-plugin']);
  assert(issues.unresolved['tsconfig.json']['tslib']); // resolved up to dep of knip itself
  assert(issues.unlisted['tsconfig.jsx-import-source-preact.json']['preact']);
  assert(issues.unresolved['tsconfig.jsx-import-source-preact.json']['preact']);
  assert(issues.unresolved['tsconfig.jsx-import-source-react.json']['vitest/globals']);
  assert(issues.unlisted['tsconfig.jsx-import-source-react.json']['hastscript']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    unlisted: 2,
    unresolved: 5,
    processed: 0,
    total: 0,
  });
});

test('Find dependencies with the TypeScript plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['tsconfig.jsx-import-source-preact.json']['preact']);
  assert(issues.unlisted['tsconfig.jsx-import-source-react.json']['hastscript']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 0,
    total: 0,
  });
});
