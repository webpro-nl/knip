import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/exports-namespace');

test('Keep namespace members public when re-exported from an entry', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});

test('Report public namespace members when entry exports are included', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['index.ts'].Config);
  assert(issues.exports['index.ts'].NS);
  assert(issues.exports['ns.ts'].y);
  assert(issues.namespaceMembers['ts-namespace.ts']['Config.external']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    namespaceMembers: 1,
    processed: 5,
    total: 5,
  });
});

for (const issueType of ['nsExports', 'nsTypes'] as const) {
  test(`Keep entry-exported namespace members public with ${issueType} enabled`, async () => {
    const options = await createOptions({ cwd, includedIssueTypes: [issueType] });
    const { counters } = await main(options);

    assert.deepEqual(counters, {
      ...baseCounters,
      processed: 5,
      total: 5,
    });
  });
}
