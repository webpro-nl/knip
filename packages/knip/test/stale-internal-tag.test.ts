import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { join } from '../src/util/path.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/stale-internal-tag');

test('Flag stale @internal tags in production mode', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, tagHints, counters } = await main(options);

  assert.deepEqual(
    tagHints,
    new Set([{ type: 'tag', filePath: join(cwd, 'module.ts'), identifier: 'usedInProdInternal', tagName: '@internal' }])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });

  assert.equal(Object.keys(issues.exports).length, 0);
});

test('Do not flag @internal tags in non-production mode', async () => {
  const options = await createOptions({ cwd });
  const { issues, tagHints, counters } = await main(options);

  assert.equal(tagHints.size, 0);
  assert(issues.exports['module.ts']['unusedInternal']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 3,
    total: 3,
  });
});
