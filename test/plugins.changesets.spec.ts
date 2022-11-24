import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as changesets from '../src/plugins/changesets/index';

const cwd = path.resolve('test/fixtures/changesets');

test('Unused dependencies in Changesets configuration', async () => {
  const configFilePaths = changesets.CONFIG_FILE_PATTERNS.map(filePath => path.join(cwd, filePath));
  for (const configFilePath of configFilePaths) {
    const dependencies = await changesets.findDependencies(configFilePath);
    assert.deepEqual(dependencies, ['@changesets/changelog-github']);
  }
});
