import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jasmine2');

test('Find dependencies with the Jasmine plugin (script arguments)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('specs/smoke.js' in issues.files));
  assert(!('specs/e2e/login.e2e.js' in issues.files));
  assert(!('reporters/progress.js' in issues.files));
  assert('specs/unrelated.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 4,
    total: 4,
  });
});
