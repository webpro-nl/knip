import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/postcss');

test('Find dependencies with the PostCSS plugin (postcss.config.js function)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
