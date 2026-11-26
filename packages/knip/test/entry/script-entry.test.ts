import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/entry/script-entry');

test('Report missing files referenced in package.json scripts', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  const filePath = join(cwd, 'package.json');
  assert.deepEqual(configurationHints, [
    { type: 'script-entry', identifier: './scripts/missing.ts', workspaceName: '.', filePath },
    { type: 'script-entry', identifier: 'scripts/missing.js', workspaceName: '.', filePath },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
