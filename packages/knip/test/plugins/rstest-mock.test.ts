import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rstest-mock');

test('Report unused exports behind rstest module promise mocks', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(issues.exports['src/calculator.ts'].multiply);
  assert(issues.exports['src/logger.ts'].warn);
  assert(!issues.exports['src/printer.ts']);
  assert(!issues.exports['src/reporter.ts']);
  assert(!issues.exports['src/auto-mocked.ts']);
  assert(!issues.exports['src/spied.ts']);
  assert(!issues.exports['src/async-factory.ts']);
  assert(!issues.exports['src/spread-factory.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 9,
    total: 9,
  });
});
