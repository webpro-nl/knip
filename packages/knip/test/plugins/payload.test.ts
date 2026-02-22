import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

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
