import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/marko-run');

test('Find dependencies with the marko plugin (@marko/run)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(issues.files['src/routes/+page.marko']);
  assert(!issues.files['src/app-routes/+page.marko']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 15,
    total: 15,
  });
});
