import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/module-resolution-non-std');

test('Resolve non-standard extensions and report unresolved imports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['src/index.ts']['@org/unresolved']);
  assert(issues.unlisted['src/index.ts']['unresolved']);
  assert(issues.unresolved['src/index.ts']['./unresolved']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    unlisted: 2,
    unresolved: 1,
    processed: 2,
    total: 2,
  });
});
