import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-manual-mocks');

test('Resolve Jest calls satisfied by manual mocks', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.unlisted['search.test.ts']['manual-search'].line, 5);
  assert(issues.unlisted['search.test.ts']['missing-search']);
  assert.equal(issues.unlisted['search.test.ts']?.['@mock/storage'], undefined);
  assert.equal(issues.unlisted['search.test.ts']?.['mock-clock'], undefined);
  assert.equal(issues.unlisted['tests/nested.test.ts'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 2,
    processed: 6,
    total: 6,
  });
});
