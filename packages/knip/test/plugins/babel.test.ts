import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/babel');

test('Find dependencies with the Babel plugin (1)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@babel/preset-react']);
  assert(issues.devDependencies['package.json']['babel-plugin-prismjs']);

  assert(issues.unresolved['.babelrc']['@babel/plugin-proposal-decorators']);
  assert(issues.unresolved['.babelrc']['babel-preset-minify']);
  assert(issues.unresolved['.babelrc']['react-hot-loader/babel']);

  assert(issues.unresolved['.babelrc.js']['@babel/plugin-transform-runtime']);
  assert(issues.unresolved['.babelrc.js']['babel-plugin-preval']);
  assert(issues.unresolved['.babelrc.js']['babel-plugin-transform-imports']);
  assert(issues.unlisted['.babelrc.js']['dotenv']);

  assert(issues.unresolved['babel.config.cts']['@babel/mod/plugin']);
  assert(issues.unresolved['babel.config.cts']['@babel/mod/preset']);
  assert(issues.unresolved['babel.config.cts']['@babel/plugin-mod']);
  assert(issues.unresolved['babel.config.cts']['@babel/plugin-mod2']);
  assert(issues.unresolved['babel.config.cts']['@babel/preset-mod']);
  assert(issues.unresolved['babel.config.cts']['@babel/preset-mod2']);
  assert(issues.unresolved['babel.config.cts']['@scope/babel-plugin']);
  assert(issues.unresolved['babel.config.cts']['@scope/babel-plugin-mod']);
  assert(issues.unresolved['babel.config.cts']['@scope/babel-preset']);
  assert(issues.unresolved['babel.config.cts']['@scope/babel-preset-mod']);
  assert(issues.unresolved['babel.config.cts']['@scope/mod/plugin']);
  assert(issues.unresolved['babel.config.cts']['@scope/mod/preset']);
  assert(issues.unresolved['babel.config.cts']['@scope/prefix-babel-plugin-mod']);
  assert(issues.unresolved['babel.config.cts']['@scope/prefix-babel-preset-mod']);
  assert(issues.unresolved['babel.config.cts']['@scope2/babel-plugin']);
  assert(issues.unresolved['babel.config.cts']['@scope2/babel-plugin-mod']);
  assert(issues.unresolved['babel.config.cts']['@scope2/babel-preset']);
  assert(issues.unresolved['babel.config.cts']['@scope2/babel-preset-mod']);
  assert(issues.unresolved['babel.config.cts']['babel-plugin-mod']);
  assert(issues.unresolved['babel.config.cts']['babel-plugin-mod2']);
  assert(issues.unresolved['babel.config.cts']['babel-preset-mod']);
  assert(issues.unresolved['babel.config.cts']['babel-preset-mod2']);
  assert(issues.unresolved['babel.config.cts']['mod/plugin']);
  assert(issues.unresolved['babel.config.cts']['mod/preset']);
  assert(issues.unresolved['babel.config.cts']['my-plugin']);
  assert(issues.unresolved['babel.config.cts']['my-preset']);

  assert(issues.unresolved['babel.config.js']['@babel/plugin-proposal-class-properties']);
  assert(issues.unresolved['babel.config.js']['@babel/plugin-proposal-nullish-coalescing-operator']);
  assert(issues.unresolved['babel.config.js']['@babel/plugin-proposal-object-rest-spread']);
  assert(issues.unresolved['babel.config.js']['@babel/plugin-proposal-optional-chaining']);
  assert(issues.unresolved['babel.config.js']['@babel/plugin-transform-runtime']);
  assert(issues.unresolved['babel.config.js']['babel-plugin-lodash']);

  assert(issues.unresolved['babel.config.cts']['./dir/plugin.js']);
  assert(issues.unresolved['babel.config.cts']['./dir/preset.js']);
  assert(issues.unresolved['babel.config.cts']['/dir/plugin.js']);
  assert(issues.unresolved['babel.config.cts']['/dir/preset.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    unlisted: 1,
    unresolved: 42,
    processed: 3,
    total: 3,
  });
});
