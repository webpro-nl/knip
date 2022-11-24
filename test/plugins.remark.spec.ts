import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as remark from '../src/plugins/remark/index';

const cwd = path.resolve('test/fixtures/remark');

test('Unused dependencies in remark configuration', async () => {
  const configFilePaths = remark.CONFIG_FILE_PATTERNS.map(filePath => path.join(cwd, filePath));
  const manifest = await import(path.join(cwd, 'package.json'));
  for (const configFilePath of configFilePaths) {
    const dependencies = await remark.findDependencies(configFilePath, { manifest });
    assert.deepEqual(dependencies, ['remark-preset-webpro']);
  }
});
