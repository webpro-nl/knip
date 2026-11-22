import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite5');

test('Find literal entries from Vite index.html inline module scripts', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/main.tsx' in issues.files));
  assert('src/unused.ts' in issues.files);
  assert('src/commented-out.ts' in issues.files);
  assert('src/decoy.ts' in issues.files);
  assert(issues.files['src/v/entry.ts']);
  assert(!issues.files['src/[variant]/entry.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 6,
    total: 6,
  });
});
