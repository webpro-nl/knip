import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/gatsby');

test('Find dependencies with the Gatsby plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['gatsby']);
  assert(issues.devDependencies['package.json']['gatsby-cli']);
  assert(issues.devDependencies['package.json']['gatsby-plugin-advanced-sitemap']);
  assert(issues.devDependencies['package.json']['gatsby-remark-prismjs']);

  assert(issues.unresolved['gatsby-config.js']['@sentry/gatsby']);
  assert(issues.unresolved['gatsby-config.js']['gatsby-plugin-webpack-bundle-analyser-v2']);
  assert(issues.unresolved['gatsby-config.js']['gatsby-remark-node-identity']);

  assert(issues.unlisted['gatsby-node.js']['@babel/plugin-proposal-function-bind']);
  assert(issues.unlisted['gatsby-node.js']['babel-plugin-transform-imports']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 4,
    unlisted: 2,
    unresolved: 3,
    processed: 2,
    total: 2,
  });
});
