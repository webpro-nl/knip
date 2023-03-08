import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = path.resolve('tests/fixtures/plugins/rollup');

test('Find dependencies in Rollup configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['rollup.config.js']['rollup-plugin-terser']);
  assert(issues.unlisted['rollup.config.js']['@rollup/plugin-node-resolve']);
  assert(issues.unlisted['rollup.config.js']['@rollup/plugin-commonjs']);
  assert(issues.unlisted['rollup.config.js']['acorn-jsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 0,
    unlisted: 4,
    processed: 1,
    total: 1,
  });
});
