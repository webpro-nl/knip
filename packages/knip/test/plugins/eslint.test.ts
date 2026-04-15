import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eslint');

test('Find dependencies with the ESLint plugin (deprecated/1)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.eslintrc.cjs']['@scope/eslint-plugin-name']);
  assert(issues.unlisted['.eslintrc.cjs']['@scope/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.cjs']['@shopify/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.js']['@babel/plugin-proposal-decorators']);
  assert(issues.unlisted['.eslintrc.js']['@next/eslint-plugin-next']);
  assert(issues.unlisted['.eslintrc.js']['@org/eslint-plugin-name']);
  assert(issues.unlisted['.eslintrc.js']['@scope-only/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.js']['@scope/eslint-config']);
  assert(issues.unlisted['.eslintrc.js']['@scope/eslint-plugin']);
  assert(issues.unlisted['.eslintrc.json']['@babel/plugin-syntax-import-assertions']);
  assert(issues.unlisted['.eslintrc.yml']['@sinonjs/eslint-config']);
  assert(issues.unlisted['.eslintrc.yml']['@sinonjs/eslint-plugin-no-prototype-methods']);

  assert(issues.unresolved['.eslintrc.cjs']['eslint-config-airbnb']);
  assert(issues.unresolved['.eslintrc.cjs']['eslint-config-next']);
  assert(issues.unresolved['.eslintrc.cjs']['eslint-plugin-import']);
  assert(issues.unresolved['.eslintrc.js']['eslint-config-airbnb']);
  assert(issues.unresolved['.eslintrc.js']['eslint-config-next']);
  assert(issues.unresolved['.eslintrc.js']['eslint-import-resolver-exports']);
  assert(issues.unresolved['.eslintrc.js']['eslint-import-resolver-typescript']);
  assert(issues.unresolved['.eslintrc.js']['eslint-plugin-cypress']);
  assert(issues.unresolved['.eslintrc.js']['eslint-plugin-eslint-comments']);
  assert(issues.unresolved['.eslintrc.js']['eslint-plugin-eslint-plugin']);
  assert(issues.unresolved['.eslintrc.json']['eslint-config-airbnb']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 12,
    unresolved: 11,
    processed: 3,
    total: 3,
  });
});
