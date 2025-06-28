import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/graphql-codegen-graphql-config');

test('Find dependencies with the graphql-codegen plugin (graphql-config)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/near-operation-file-preset']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/schema-ast']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/introspection']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/typescript']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/typescript-urql']);
  assert(issues.unlisted['graphql.config.ts']['@graphql-codegen/typescript-msw']);

  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/add']);
  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/typescript']);
  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/typed-document-node']);
  assert(issues.unlisted['.graphqlrc']['@graphql-codegen/typescript-resolvers']);

  assert(issues.unlisted['graphql.config.toml']['@graphql-codegen/add']);
  assert(issues.unlisted['graphql.config.toml']['@graphql-codegen/typescript']);
  assert(issues.unlisted['graphql.config.toml']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['graphql.config.toml']['@graphql-codegen/typed-document-node']);
  assert(issues.unlisted['graphql.config.toml']['@graphql-codegen/typescript-resolvers']);

  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 18,
    processed: 1,
    total: 1,
  });
});
