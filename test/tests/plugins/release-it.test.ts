import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as releaseIt from '../../../src/plugins/release-it/index.js';

const cwd = path.resolve('test/fixtures/plugins/release-it');

test('Find dependencies in Release It configuration (json)', async () => {
  const configFilePath = path.join(cwd, '.release-it.json');
  const dependencies = await releaseIt.findDependencies(configFilePath, { cwd });
  assert.deepEqual(dependencies, ['@release-it/bumper', '@release-it/conventional-changelog', 'from-hook']);
});
