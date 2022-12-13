import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

test('Find unused files and exports', async () => {
  const cwd = path.resolve('test/fixtures/dynamic-imports');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.unlisted['index.ts']['no-substitution-tpl-literal'].symbol, 'no-substitution-tpl-literal');
  assert.equal(issues.unlisted['index.ts']['string-literal'].symbol, 'string-literal');
  assert.equal(issues.unlisted['dir/mod.ts']['another-unlisted'].symbol, 'another-unlisted');

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 3,
    processed: 2,
    total: 2,
  });
});
