import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mocha2');

test('Find dependencies with the Mocha plugin (file)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('hooks/db.setup.js' in issues.files));
  assert(!('teardown/index.js' in issues.files));
  assert(!('hooks/globals.js' in issues.files));
  assert('unrelated.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 5,
    total: 5,
  });
});
