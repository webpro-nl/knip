import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';
import baseCounters from './fixtures/baseCounters.js';

test('Find unused files and exports', async () => {
  const cwd = path.resolve('test/fixtures/dynamic-imports');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.unlisted['index.ts']['no-substitution-tpl-literal'].symbol, 'no-substitution-tpl-literal');
  assert.equal(issues.unlisted['index.ts']['string-literal'].symbol, 'string-literal');

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 1,
    total: 1,
  });
});
