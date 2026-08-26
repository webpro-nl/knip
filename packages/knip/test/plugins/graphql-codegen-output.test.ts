import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/graphql-codegen-output');

test('Mark graphql-codegen generated outputs as entries', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.exports['src/gql/graphql.ts']?.['GeneratedDocument']);
  assert(!issues.types['src/gql/graphql.ts']?.['GeneratedQuery']);
  assert(!('src/gql/graphql.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
