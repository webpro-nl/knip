import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/gatsby');

test('Find dependencies with the Gatsby plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['gatsby']);
  assert(issues.devDependencies['package.json']['gatsby-cli']);
  assert(issues.devDependencies['package.json']['gatsby-plugin-advanced-sitemap']);
  assert(issues.devDependencies['package.json']['gatsby-remark-prismjs']);

  assert(issues.unresolved['gatsby-config.js']['gatsby-plugin-webpack-bundle-analyser-v2']);
  assert(issues.unresolved['gatsby-config.js']['gatsby-remark-node-identity']);

  assert(issues.unlisted['gatsby-config.js']['@sentry/gatsby']);
  assert(issues.unlisted['gatsby-node.js']['@babel/plugin-proposal-function-bind']);
  assert(issues.unlisted['gatsby-node.js']['babel-plugin-transform-imports']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 4,
    unlisted: 3,
    unresolved: 2,
    processed: 2,
    total: 2,
  });
});
