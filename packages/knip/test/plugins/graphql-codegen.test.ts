import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/graphql-codegen');

test('Find dependencies with the graphql-codegen plugin (codegen.ts function)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['codegen.ts']['@graphql-codegen/near-operation-file-preset']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/schema-ast']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/introspection']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-urql']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-msw']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/graphql-modules-preset']);
  assert(issues.unlisted['codegen.ts']['graphql-codegen-typescript-validation-schema']);

  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/add']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typed-document-node']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript-resolvers']);

  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 15,
    processed: 1,
    total: 1,
  });
});
