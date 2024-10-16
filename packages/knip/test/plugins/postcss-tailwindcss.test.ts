import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/postcss-tailwindcss');

test('Find dependencies with the PostCSS plugin (with tailwindcss)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['postcss.config.js']['tailwindcss']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
