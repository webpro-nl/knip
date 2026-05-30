import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite5');

test('Find entry from Vite index.html inline module script', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/main.tsx' in issues.files));
  assert('src/unused.ts' in issues.files);
  assert('src/commented-out.ts' in issues.files);
  assert('src/decoy.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 4,
    total: 4,
  });
});
