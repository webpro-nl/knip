import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/types/enum-members-element-access-string-key');

test('Resolve named string-key access precisely and treat numeric-key access as a whole read', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.enumMembers['codes.ts']).length, 2);
  assert(issues.enumMembers['codes.ts']['NamedKey.unusedFirst']);
  assert(issues.enumMembers['codes.ts']['NamedKey.unusedSecond']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});
