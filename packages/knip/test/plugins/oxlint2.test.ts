import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/oxlint-js-plugins');

test('Find dependencies and literal files with the oxlint plugin (jsPlugins)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['v/plugin.mjs']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});
