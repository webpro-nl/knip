import assert from 'node:assert/strict';
import test from 'node:test';
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

  assert(issues.unlisted['.babelrc']['@babel/plugin-proposal-decorators']);
  assert(issues.unlisted['.babelrc']['babel-preset-minify']);
  assert(issues.unlisted['.babelrc']['react-hot-loader/babel']);

  assert(issues.unlisted['.babelrc.js']['@babel/plugin-transform-runtime']);
  assert(issues.unlisted['.babelrc.js']['babel-plugin-preval']);
  assert(issues.unlisted['.babelrc.js']['babel-plugin-transform-imports']);
  assert(issues.unlisted['.babelrc.js']['dotenv']);

  assert(issues.unlisted['babel.config.cts']['@babel/mod/plugin']);
  assert(issues.unlisted['babel.config.cts']['@babel/mod/preset']);
  assert(issues.unlisted['babel.config.cts']['@babel/plugin-mod']);
  assert(issues.unlisted['babel.config.cts']['@babel/plugin-mod2']);
  assert(issues.unlisted['babel.config.cts']['@babel/preset-mod']);
  assert(issues.unlisted['babel.config.cts']['@babel/preset-mod2']);
  assert(issues.unlisted['babel.config.cts']['@scope/babel-plugin']);
  assert(issues.unlisted['babel.config.cts']['@scope/babel-plugin-mod']);
  assert(issues.unlisted['babel.config.cts']['@scope/babel-preset']);
  assert(issues.unlisted['babel.config.cts']['@scope/babel-preset-mod']);
  assert(issues.unlisted['babel.config.cts']['@scope/mod/plugin']);
  assert(issues.unlisted['babel.config.cts']['@scope/mod/preset']);
  assert(issues.unlisted['babel.config.cts']['@scope/prefix-babel-plugin-mod']);
  assert(issues.unlisted['babel.config.cts']['@scope/prefix-babel-preset-mod']);
  assert(issues.unlisted['babel.config.cts']['@scope2/babel-plugin']);
  assert(issues.unlisted['babel.config.cts']['@scope2/babel-plugin-mod']);
  assert(issues.unlisted['babel.config.cts']['@scope2/babel-preset']);
  assert(issues.unlisted['babel.config.cts']['@scope2/babel-preset-mod']);
  assert(issues.unlisted['babel.config.cts']['babel-plugin-mod']);
  assert(issues.unlisted['babel.config.cts']['babel-plugin-mod2']);
  assert(issues.unlisted['babel.config.cts']['babel-preset-mod']);
  assert(issues.unlisted['babel.config.cts']['babel-preset-mod2']);
  assert(issues.unlisted['babel.config.cts']['mod/plugin']);
  assert(issues.unlisted['babel.config.cts']['mod/preset']);
  assert(issues.unlisted['babel.config.cts']['my-plugin']);
  assert(issues.unlisted['babel.config.cts']['my-preset']);

  assert(issues.unlisted['babel.config.js']['@babel/plugin-proposal-class-properties']);
  assert(issues.unlisted['babel.config.js']['@babel/plugin-proposal-nullish-coalescing-operator']);
  assert(issues.unlisted['babel.config.js']['@babel/plugin-proposal-object-rest-spread']);
  assert(issues.unlisted['babel.config.js']['@babel/plugin-proposal-optional-chaining']);
  assert(issues.unlisted['babel.config.js']['@babel/plugin-transform-runtime']);
  assert(issues.unlisted['babel.config.js']['babel-plugin-lodash']);

  assert(issues.unresolved['babel.config.cts']['./dir/plugin.js']);
  assert(issues.unresolved['babel.config.cts']['./dir/preset.js']);
  assert(issues.unresolved['babel.config.cts']['/dir/plugin.js']);
  assert(issues.unresolved['babel.config.cts']['/dir/preset.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    unlisted: 39,
    unresolved: 4,
    processed: 3,
    total: 3,
  });
});
