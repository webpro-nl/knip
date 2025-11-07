import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/postcss-tailwindcss');

test('Find dependencies with the PostCSS plugin (with tailwindcss)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['postcss.config.js']['tailwindcss']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
