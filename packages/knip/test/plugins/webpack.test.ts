import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/webpack');

test('Find dependencies with the Webpack plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/unused.ts')));
  assert(issues.devDependencies['package.json']['@babel/plugin-proposal-object-rest-spread']);
  assert(issues.devDependencies['package.json']['buffer']);
  assert(issues.unresolved['webpack.config.js']['svgo-loader']);
  assert(issues.unlisted['webpack.dev.js']['eslint-webpack-plugin']);
  assert(issues.unlisted['webpack.prod.js']['terser-webpack-plugin']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    devDependencies: 2,
    unlisted: 2,
    unresolved: 1,
    processed: 13,
    total: 13,
  });
});
