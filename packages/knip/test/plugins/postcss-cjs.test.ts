import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/postcss-cjs');

test('Find dependencies with the PostCSS plugin (function)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['package.json']['autoprefixer']);
  assert(issues.unlisted['postcss.config.cjs']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
