import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/graphql-codegen-near-operation-file');

test('Mark only the near-operation-file preset outputs as entries, not the documents directory', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/__generated__/used.generated.ts' in issues.files));
  assert(!issues.exports['src/__generated__/used.generated.ts']?.['GeneratedDocument']);
  assert(!issues.types['src/__generated__/used.generated.ts']?.['GeneratedQuery']);

  // `folder: '../__generated__'` resolves against each document's directory, two levels deep here
  assert(!('features/nested/__generated__/Query.generated.ts' in issues.files));
  assert(!issues.exports['features/nested/__generated__/Query.generated.ts']?.['NestedDocument']);

  // `filePerOperation` names the file after the operation, not `fileName`
  assert(!('operations/GetUser.generated.ts' in issues.files));
  assert(!issues.exports['operations/GetUser.generated.ts']?.['GetUserDocument']);

  assert('src/unused.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 9,
    total: 9,
  });
});
