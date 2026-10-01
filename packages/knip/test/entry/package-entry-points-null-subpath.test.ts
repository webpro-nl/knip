import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/package-entry-points-null-subpath');

test('Exclude files behind a null package entry point', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/internal/orphan.ts' in issues.files);
  assert(issues.exports['src/internal/format.ts']?.['formatLoud']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});
