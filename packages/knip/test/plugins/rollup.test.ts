import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

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
    files: 1,
    unlisted: 4,
    processed: 2,
    total: 2,
  });
});
