import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as cspell from '../../../src/plugins/cspell/index.js';

const cwd = path.resolve('test/fixtures/plugins/cspell');

test('Find dependencies in cspell configuration (json)', async () => {
  const configFilePath = path.join(cwd, '.cspell.json');
  const dependencies = await cspell.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['@cspell/dict-cryptocurrencies']);
});
