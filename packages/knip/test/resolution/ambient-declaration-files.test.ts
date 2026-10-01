import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/ambient-declaration-files');

test('Ambient .d.ts (no exports) are not reported unused under a solution-style tsconfig', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // globals.d.ts (declare global), untyped-module.d.ts (declare module) and
  // vendor-augmentation.d.ts (side-effect import) carry no exports → ambient.
  // orphan-types.d.ts exports a type nothing imports → genuinely unused.
  assert.deepEqual(Object.keys(issues.files), ['src/orphan-types.d.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    files: 1,
  });
});
