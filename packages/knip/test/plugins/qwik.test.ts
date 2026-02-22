import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/qwik');
const cwdCustomDirs = resolve('fixtures/plugins/qwik-custom-dirs');

test('Find dependencies with the Qwik plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 8,
    total: 8,
  });
});

test('Find dependencies with the Qwik plugin (custom srcDir and routesDir[])', async () => {
  const options = await createOptions({ cwd: cwdCustomDirs });
  const { issues, counters } = await main(options);

  assert(!issues.files.has(join(cwdCustomDirs, 'docs/extra-pages/index.tsx')));
  assert(!issues.files.has(join(cwdCustomDirs, 'docs/pages/guide.mdx')));
  assert(!issues.files.has(join(cwdCustomDirs, 'docs/components/mdx-note.tsx')));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 10,
    total: 10,
  });
});
