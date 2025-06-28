import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/postcss');

test('Find dependencies with the PostCSS plugin (postcss.config.js function)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['package.json']['autoprefixer']);
  assert(issues.unlisted['postcss.config.js']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
