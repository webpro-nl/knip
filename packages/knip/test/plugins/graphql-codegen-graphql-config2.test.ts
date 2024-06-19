import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/graphql-codegen-graphql-config2');

test('Find dependencies with the graphql-codegen plugin (graphql-config but not installed)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});
