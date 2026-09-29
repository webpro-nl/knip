import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eslint6');

test('Find dependencies with the ESLint plugin (deprecated/6)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.eslintrc.json']['@babel/eslint-parser']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});
