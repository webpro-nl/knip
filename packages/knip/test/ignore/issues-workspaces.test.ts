import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore/issues-workspaces');

test('Ignore issue types per workspace (paths relative to workspace root)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.exports['packages/apple/helpers.ts']?.['unusedApple']);
  assert(issues.exports['packages/banana/helpers.ts']?.['unusedBanana']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 4,
    total: 4,
  });
});
