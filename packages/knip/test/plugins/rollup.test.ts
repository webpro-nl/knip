import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rollup');

test('Find dependencies with the Rollup plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['rollup.config.js']['rollup-plugin-terser']);
  assert(issues.unlisted['rollup.config.js']['@rollup/plugin-node-resolve']);
  assert(issues.unlisted['rollup.config.js']['@rollup/plugin-commonjs']);
  assert(issues.unlisted['rollup.config.js']['acorn-jsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 4,
    processed: 2,
    total: 2,
  });
});
