import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/cspell');

test('Find dependencies with the Cspell plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['.cspell.json']['@cspell/dict-cryptocurrencies']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    // case-sensitivity: fast-glob returns two files (.cspell.json and .cSpell.json) while there's only one
    unlisted: process.platform === 'darwin' || process.platform === 'win32' ? 2 : 1,
    processed: 0,
    total: 0,
  });
});
