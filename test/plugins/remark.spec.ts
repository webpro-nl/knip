import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as remark from '../../src/plugins/remark/index.js';

const cwd = path.resolve('test/fixtures/plugins/remark');

test('Unused dependencies in remark configuration', async () => {
  const manifestFilePath = path.join(cwd, 'package.json');
  const manifest = await import(manifestFilePath);
  const dependencies = await remark.findDependencies(manifestFilePath, { manifest });
  assert.deepEqual(dependencies, ['remark-preset-webpro']);
});
