import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/graphql-codegen');
const scriptConfigCwd = resolve('fixtures/plugins/graphql-codegen-script-config');
const scriptConfigCwdContextCwd = resolve('fixtures/plugins/graphql-codegen-script-config-cwd-context');

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
  assert(issues.unlisted['codegen.ts']['graphql-codegen-apollo-next-ssr']);

  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/add']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript-operations']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typed-document-node']);
  assert(issues.unlisted['codegen.yaml']['@graphql-codegen/typescript-resolvers']);

  assert(issues.unlisted['package.json']['@graphql-codegen/client-preset']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 16,
    processed: 1,
    total: 1,
  });
});

test('Find dependencies from a graphql-codegen script config', async () => {
  const options = await createOptions({ cwd: scriptConfigCwd });
  const { issues, counters } = await main(options);

  assert(!issues.files['src/codegen.ts']);
  assert(!issues.files['src/codegen-helpers.ts']);
  assert(!issues.dependencies['package.json']?.['@graphql-codegen/typescript']);
  assert(!issues.dependencies['package.json']?.['@graphql-codegen/typescript-operations']);
  assert(!issues.dependencies['package.json']?.['@graphql-codegen/typescript-graphql-request']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Find dependencies from a graphql-codegen script config loaded from the workspace cwd', async () => {
  const processCwd = process.cwd();
  const options = await createOptions({ cwd: scriptConfigCwdContextCwd });
  const { issues, counters } = await main(options);

  assert.equal(process.cwd(), processCwd);
  assert(!issues.dependencies['package.json']?.['@graphql-codegen/typescript']);
  assert(!issues.dependencies['package.json']?.['@graphql-codegen/typescript-operations']);
  assert(!issues.dependencies['package.json']?.['@graphql-codegen/typescript-graphql-request']);
  assert(!issues.devDependencies['package.json']?.['@graphql-codegen/typescript']);
  assert(!issues.devDependencies['package.json']?.['@graphql-codegen/typescript-operations']);
  assert(!issues.devDependencies['package.json']?.['@graphql-codegen/typescript-graphql-request']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
