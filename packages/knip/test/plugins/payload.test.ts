import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/payload');

test('Find dependencies with the Payload CMS plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Ignore migration issues with the Payload CMS plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.unlisted['migrations/20260218.ts']);
  assert(!issues.files.has(join(cwd, 'migrations/20260218.ts')));
});

test('Mark importMap components as used with the Payload CMS plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.files.has(join(cwd, 'src/components/ImportMapComponent.tsx')));
  assert(!issues.exports['src/components/ImportMapComponent.tsx']?.ImportMapComponent);
});
