import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/payload');
const options = await createOptions({ cwd });
const { counters, issues } = await main(options);

test('Find dependencies with the Payload CMS plugin', async () => {
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Ignore migration issues with the Payload CMS plugin', async () => {
  assert(!issues.unlisted['migrations/20260218.ts']);
  assert(!issues.files.has(join(cwd, 'migrations/20260218.ts')));
});

test('Mark importMap components as used with the Payload CMS plugin', async () => {
  assert(!issues.files.has(join(cwd, 'src/components/ImportMapComponent.tsx')));
  assert(!issues.exports['src/components/ImportMapComponent.tsx']?.ImportMapComponent);
});
