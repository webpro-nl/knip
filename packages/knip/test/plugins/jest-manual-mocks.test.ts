import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-manual-mocks');

test('Report Jest module references without resolving manual mocks', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.unlisted['search.test.ts']['manual-search'].line, 5);
  assert(issues.unlisted['search.test.ts']['missing-search']);

  // Known false positives: Jest resolves these names through __mocks__, which Knip does not model.
  assert(issues.unlisted['search.test.ts']['@mock/storage']);
  assert(issues.unlisted['search.test.ts']['mock-clock']);
  assert(issues.unlisted['tests/nested.test.ts']['manual-search']);
  assert(issues.unlisted['tests/nested.test.ts']['@mock/storage']);
  assert(issues.unlisted['tests/nested.test.ts']['mock-clock']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 7,
    processed: 6,
    total: 6,
  });
});
