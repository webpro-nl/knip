import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/bun9');

test('Find dependencies with the Bun plugin (path filter arguments)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/button.dom.test.tsx' in issues.files));
  assert(!('src/feature/flow.test.ts' in issues.files));
  assert(!('src/api.integration.test.ts' in issues.files));
  assert(!('src/queue.test.mjs' in issues.files));
  assert('src/other.test.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 6,
    total: 6,
  });
});
