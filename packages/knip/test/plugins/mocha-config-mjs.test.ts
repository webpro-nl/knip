import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/mocha-config-mjs');

test('Find dependencies with the Mocha plugin (.mocharc.mjs)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('specs/example.test.js' in issues.files));
  assert('unrelated.js' in issues.files);
  assert(!issues.devDependencies['package.json']?.['mocha-junit-reporter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
