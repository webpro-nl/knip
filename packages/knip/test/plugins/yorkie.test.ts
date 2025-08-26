import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/yorkie');

test('Find dependencies with the yorkie plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['lint-staged']);
  assert(issues.binaries['package.json']['eslint']);
  assert(issues.binaries['package.json']['markdownlint']);
  assert(issues.binaries['package.json']['svgo']);
  assert(issues.binaries['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 4,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});
