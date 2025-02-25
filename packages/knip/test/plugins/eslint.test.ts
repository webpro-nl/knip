import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/eslint');

test('Find dependencies with the ESLint plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['.eslintrc.cjs']['@scope/eslint-plugin']);
  assert(issues.unresolved['.eslintrc.cjs']['@scope/eslint-plugin-name']);
  assert(issues.unresolved['.eslintrc.cjs']['@shopify/eslint-plugin']);
  assert(issues.unresolved['.eslintrc.cjs']['eslint-config-airbnb']);
  assert(issues.unresolved['.eslintrc.cjs']['eslint-config-next']);
  assert(issues.unresolved['.eslintrc.cjs']['eslint-plugin-import']);

  assert(issues.unresolved['.eslintrc.js']['@babel/plugin-proposal-decorators']);
  assert(issues.unresolved['.eslintrc.js']['@next/eslint-plugin-next/recommended']);
  assert(issues.unresolved['.eslintrc.js']['@scope-only/eslint-plugin']);
  assert(issues.unresolved['.eslintrc.js']['@scope/eslint-config/file']);
  assert(issues.unresolved['.eslintrc.js']['@scope/eslint-plugin']);
  assert(issues.unresolved['.eslintrc.js']['eslint-config-airbnb']);
  assert(issues.unresolved['.eslintrc.js']['eslint-config-next']);
  assert(issues.unresolved['.eslintrc.js']['eslint-import-resolver-exports']);
  assert(issues.unresolved['.eslintrc.js']['eslint-import-resolver-typescript']);
  assert(issues.unresolved['.eslintrc.js']['eslint-plugin-cypress']);
  assert(issues.unresolved['.eslintrc.js']['eslint-plugin-eslint-comments']);
  assert(issues.unresolved['.eslintrc.js']['eslint-plugin-eslint-plugin']);
  assert(issues.unresolved['.eslintrc.js']['@org/eslint-plugin-name/typescript']);

  assert(issues.unresolved['.eslintrc.json']['@babel/plugin-syntax-import-assertions']);
  assert(issues.unresolved['.eslintrc.json']['eslint-config-airbnb']);

  assert(issues.unresolved['.eslintrc.yml']['@sinonjs/eslint-config']);
  assert(issues.unresolved['.eslintrc.yml']['@sinonjs/eslint-plugin-no-prototype-methods']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 23,
    processed: 5,
    total: 5,
  });
});
