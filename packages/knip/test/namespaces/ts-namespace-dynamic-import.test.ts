import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/namespaces/ts-namespace-dynamic-import');

test('Find unused namespace members accessed through dynamic imports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.namespaceMembers['util.ts']['Util.unused']);
  assert(issues.namespaceMembers['dynamic-only.ts']['Helpers.unused']);

  assert(!issues.namespaceMembers['util.ts']?.['Util.staticallyUsed']);
  assert(!issues.namespaceMembers['util.ts']?.['Util.dynamicallyUsed']);
  assert(!issues.namespaceMembers['util.ts']?.['Util.inlineUsed']);
  assert(!issues.namespaceMembers['util.ts']?.['Util.thenUsed']);
  assert(!issues.namespaceMembers['util.ts']?.['Util.nsUsed']);
  assert(!issues.namespaceMembers['dynamic-only.ts']?.['Helpers.used']);

  assert.deepEqual(counters, {
    ...baseCounters,
    namespaceMembers: 2,
    processed: 4,
    total: 4,
  });
});
