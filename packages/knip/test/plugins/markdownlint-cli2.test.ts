import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/markdownlint-cli2');

test('Find dependencies with the markdownlint-cli2 plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  console.log(issues);

  assert(issues.unresolved['.markdownlint-cli2.mjs']['markdownlint-rule-relative-links']);

  assert(issues.binaries['package.json']['markdownlint-cli2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 0,
    total: 0,
  });
});
