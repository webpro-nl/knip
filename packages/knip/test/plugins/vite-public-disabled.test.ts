import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-public-disabled');

test('Respect disabled Vite public directories', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['public/classic.js', 'public/module.js'].sort());

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 4,
    total: 4,
  });
});
