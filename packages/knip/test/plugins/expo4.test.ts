import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/expo4');

test('Find Metro config in Expo project without direct Metro dependency', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(counters.files === 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
