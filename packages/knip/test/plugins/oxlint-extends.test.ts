import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/oxlint-extends');

test('Find dependencies from oxlint extends config', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(issues.unlisted['oxlint-shared.config.ts']['eslint-plugin-missing']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
    unlisted: 1,
  });
});
