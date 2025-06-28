import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/postcss-next');

test('Find dependencies with the PostCSS plugin (implicit w/ Next.js)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['package.json']['autoprefixer']);
  assert(issues.unresolved['postcss.config.json']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
  });
});
