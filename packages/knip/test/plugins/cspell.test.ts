import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/cspell');

test('Find dependencies with the Cspell plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['.cspell.json']['@cspell/dict-cryptocurrencies/cspell-ext.json']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    // TODO fast-glob returns two files cspell.json and .cSpell.json while there's only one file on disk
    unresolved: process.platform === 'darwin' || process.platform === 'win32' ? 2 : 1,
    processed: 0,
    total: 0,
  });
});
