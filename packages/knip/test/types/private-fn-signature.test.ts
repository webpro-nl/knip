import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/types/private-fn-signature');

test('Report types used only in a non-exported function signature (issue #1950)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.types['src/lib.ts']['AsPrivateParam']);
  assert(issues.types['src/lib.ts']['AsLocalAnnotation']);
  assert(issues.types['src/lib.ts']['Unused']);

  assert.equal(issues.types['src/lib.ts']['AsParam'], undefined);
  assert.equal(issues.types['src/lib.ts']['AsReturn'], undefined);
  assert.equal(issues.types['src/lib.ts']['AsGenericArg'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 3,
    processed: 2,
    total: 2,
  });
});
