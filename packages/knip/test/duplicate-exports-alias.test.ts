import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/duplicate-exports-alias');

test('Ignore duplicate exports with @alias (JSDoc)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.duplicates['helpers.ts']['isUntagged|isUntaggedAlias']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    duplicates: 1,
    processed: 2,
    total: 2,
  });
});
