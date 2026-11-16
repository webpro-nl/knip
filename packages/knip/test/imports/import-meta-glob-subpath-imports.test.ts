import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/import-meta-glob-subpath-imports');

test('Resolve import.meta.glob patterns with subpath imports as entry files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['widgets/secret.ts', 'workers/video.worklet.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 6,
    total: 6,
  });
});
