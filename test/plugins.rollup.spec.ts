import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';
import baseCounters from './fixtures/baseCounters.js';

const cwd = path.resolve('test/fixtures/rollup');

test('Unused dependencies in rollup configuration', async () => {
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
