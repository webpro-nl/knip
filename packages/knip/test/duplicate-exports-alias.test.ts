import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

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
