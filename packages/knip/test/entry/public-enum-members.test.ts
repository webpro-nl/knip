import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/public-enum-members');

test('Keep internally unused enum members public when re-exported from an entry', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Report public enum members when entry exports are included', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues } = await main(options);

  assert(issues.enumMembers['mode.ts']['Mode.external']);
});

for (const issueType of ['nsExports', 'nsTypes'] as const) {
  test(`Keep entry-exported enum members public with ${issueType} enabled`, async () => {
    const options = await createOptions({ cwd, includedIssueTypes: [issueType] });
    const { counters } = await main(options);

    assert.deepEqual(counters, {
      ...baseCounters,
      processed: 3,
      total: 3,
    });
  });
}
