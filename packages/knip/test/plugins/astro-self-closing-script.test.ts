import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/astro-self-closing-script');

test('Self-closing <script /> does not swallow the next <script> in .astro', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal('src/lib/used.ts' in issues.files, false);
  assert('src/lib/unused.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
