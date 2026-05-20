import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/graphql-codegen-helper-plugins');

test('Find dependencies with the graphql-codegen plugin (helper config module)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.devDependencies['package.json']?.['@graphql-codegen/typescript']);
  assert(!issues.devDependencies['package.json']?.['@graphql-codegen/typescript-operations']);
  assert(!issues.devDependencies['package.json']?.['@graphql-codegen/typescript-graphql-request']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
