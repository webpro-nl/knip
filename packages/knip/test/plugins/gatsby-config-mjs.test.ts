import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/gatsby-config-mjs');

test('Find dependencies with the Gatsby plugin (gatsby-config.mjs, gatsby-node.mjs)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/pages/index.js' in issues.files));
  assert('unrelated.js' in issues.files);
  assert(!issues.devDependencies['package.json']?.['gatsby-plugin-manifest']);
  assert(!issues.devDependencies['package.json']?.['babel-plugin-transform-imports']);
  assert(!issues.devDependencies['package.json']?.['babel-plugin-from-local-plugin']);

  assert(issues.devDependencies['package.json']['gatsby']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 5,
    total: 5,
  });
});
