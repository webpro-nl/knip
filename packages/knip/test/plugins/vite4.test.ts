import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite4');

test('Find entry from Vite index.html with custom root', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('app/main.ts' in issues.files));
  assert(!('app/component.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
