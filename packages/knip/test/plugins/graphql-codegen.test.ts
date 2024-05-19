import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/graphql-codegen');

test('Find dependencies with the graphql-codegen plugin (codegen.ts function)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['codegen.ts']['@graphql-codegen/near-operation-file-preset']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/schema-ast']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/introspection']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-urql']);
  assert(issues.unlisted['codegen.ts']['@graphql-codegen/typescript-msw']);

  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typed-document-node']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript-resolvers']);

  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/introspection']);
  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/schema-ast']);

  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/schema-ast']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/near-operation-file-preset']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/typescript-msw']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 18,
    processed: 2,
    total: 2,
  });
});
