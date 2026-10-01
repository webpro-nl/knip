import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsconfig-types-references');

test('Attribute referenced tsconfig.json compilerOptions.types to the owning workspace', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.devDependencies['packages/app/package.json']?.['@types/chrome']);
  assert(!issues.unresolved['packages/app/tsconfig.test.json']?.['chrome']);
  assert(!issues.unlisted['packages/app/tsconfig.test.json']?.['chrome']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
