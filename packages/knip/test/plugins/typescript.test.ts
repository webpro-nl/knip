import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/typescript');

test('Find dependencies with the TypeScript plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['tsconfig.json']['@tsconfig/node16/tsconfig.json']);
  assert(issues.unlisted['tsconfig.json']['typescript-eslint-language-service']);
  assert(issues.unlisted['tsconfig.json']['ts-graphql-plugin']);
  assert(issues.unlisted['tsconfig.json']['tslib']);
  assert(issues.unlisted['tsconfig.base.json']['@tsconfig/node20/tsconfig.json']);
  assert(issues.unlisted['tsconfig.ext.json']['@tsconfig/node20/tsconfig.json']);
  assert(issues.unlisted['tsconfig.jsx-import-source-preact.json']['preact']);
  assert(issues.unlisted['tsconfig.jsx-import-source-react.json']['vitest/globals']);
  assert(issues.unlisted['tsconfig.jsx-import-source-react.json']['hastscript/svg']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 9,
    processed: 0,
    total: 0,
  });
});

test('Find dependencies with the TypeScript plugin (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert(issues.unlisted['tsconfig.jsx-import-source-preact.json']['preact']);
  assert(issues.unlisted['tsconfig.jsx-import-source-react.json']['hastscript/svg']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 0,
    total: 0,
  });
});
