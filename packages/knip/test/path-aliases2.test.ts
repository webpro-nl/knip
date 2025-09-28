import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/path-aliases2');

test('Resolve path aliases from plugin inputs', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['lodash-es']);
  assert(issues.unlisted['index.ts']['lodash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    processed: 16,
    total: 16,
  });
});
