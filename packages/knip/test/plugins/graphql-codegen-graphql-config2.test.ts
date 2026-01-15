import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/graphql-codegen-graphql-config2');

test('Find dependencies with the graphql-codegen plugin (graphql-config but not installed)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});
