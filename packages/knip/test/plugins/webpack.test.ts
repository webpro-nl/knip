import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/webpack');

test('Find dependencies with the Webpack plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/unused.ts' in issues.files);
  assert(!('src/routes.ts' in issues.files));
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
    processed: 17,
    total: 17,
  });
});
