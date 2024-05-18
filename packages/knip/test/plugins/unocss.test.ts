import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/unocss');

test('Find dependencies with the unocss plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  // console.log(issues);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 2,
    total: 2,
  });
  assert(issues.unlisted['main.ts']['virtual:uno.css']);
});
