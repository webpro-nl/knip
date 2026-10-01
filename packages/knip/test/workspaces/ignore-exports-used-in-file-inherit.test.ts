import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Respect ignoreExportsUsedInFile per workspace (inherit root, override disables)', async () => {
  const cwd = resolve('fixtures/workspaces/ignore-exports-used-in-file-inherit');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // app overrides root true back to false → internally-used type is reported
  assert(issues.types['packages/app/fruits.ts']['Pip']);
  // lib inherits root true → internally-used type is ignored
  assert.equal(issues.types['packages/lib/leaves.ts'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 1,
    processed: 4,
    total: 4,
  });
});
