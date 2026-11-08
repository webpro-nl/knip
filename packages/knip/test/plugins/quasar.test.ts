import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/quasar');

test('Resolve literal extensionless boot entries with the quasar plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/boot/forgotten.ts' in issues.files);
  assert.deepEqual(Object.keys(issues.files).sort(), ['src/boot/forgotten.ts', 'src/boot/literal.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 9,
    total: 9,
  });
});
