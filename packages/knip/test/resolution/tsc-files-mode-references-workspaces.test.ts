import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsc-files-mode-references-workspaces');

test('Should not use files of tsconfigs referenced outside the project directory', async () => {
  const options = await createOptions({ cwd, isUseTscFiles: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['packages/app/src/module.ts']['unused']);
  assert.equal(issues.exports['packages/ign/src/module.ts'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 2,
    total: 2,
  });
});
