import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsconfig-types-extends');

test('Treat extended tsconfig.json compilerOptions.types entries as type-only in the workspace', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.devDependencies['packages/script/package.json']?.['@types/chrome']);
  assert(!issues.unresolved['tsconfig.base.json']?.['chrome']);
  assert(!issues.unlisted['tsconfig.base.json']?.['chrome']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
