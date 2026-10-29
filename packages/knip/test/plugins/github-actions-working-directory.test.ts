import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/github-actions-working-directory');

test('Glob a script entry pattern from the working directory of a step', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.files), ['specs/app.spec.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});
