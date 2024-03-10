import assert from 'node:assert/strict';
import test from 'node:test';
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

  assert(issues.unlisted['.eslintrc.cjs']['@scope/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.cjs']['@scope/eslint-plugin-name']);
  assert(issues.unlisted['.eslintrc.cjs']['@shopify/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.cjs']['eslint-config-airbnb']);
  assert(issues.unlisted['.eslintrc.cjs']['eslint-config-next']);
  assert(issues.unlisted['.eslintrc.cjs']['eslint-plugin-import']);

  assert(issues.unlisted['.eslintrc.js']['@babel/plugin-proposal-decorators']);
  assert(issues.unlisted['.eslintrc.js']['@next/eslint-plugin-next/recommended']);
  assert(issues.unlisted['.eslintrc.js']['@scope-only/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.js']['@scope/eslint-config/file']);
  assert(issues.unlisted['.eslintrc.js']['@scope/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.js']['eslint-config-airbnb']);
  assert(issues.unlisted['.eslintrc.js']['eslint-config-next']);
  assert(issues.unlisted['.eslintrc.js']['eslint-import-resolver-exports']);
  assert(issues.unlisted['.eslintrc.js']['eslint-import-resolver-typescript']);
  assert(issues.unlisted['.eslintrc.js']['eslint-plugin-cypress']);
  assert(issues.unlisted['.eslintrc.js']['eslint-plugin-eslint-comments']);
  assert(issues.unlisted['.eslintrc.js']['eslint-plugin-eslint-plugin']);
  assert(issues.unlisted['.eslintrc.js']['eslint-plugin-import']);

  assert(issues.unlisted['.eslintrc.json']['@babel/plugin-syntax-import-assertions']);
  assert(issues.unlisted['.eslintrc.json']['eslint-config-airbnb']);
  assert(issues.unlisted['.eslintrc.json']['eslint-plugin-import']);

  assert(issues.unlisted['.eslintrc.yml']['@sinonjs/eslint-config']);
  assert(issues.unlisted['.eslintrc.yml']['@sinonjs/eslint-plugin-no-prototype-methods']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 24,
    processed: 4,
    total: 4,
  });
});
