import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as remark from '../../src/plugins/remark/index.js';
import { getManifest } from '../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/remark');
const manifestFilePath = path.join(cwd, 'package.json');
const manifest = getManifest(cwd);

test('Find dependencies in Remark configuration', async () => {
  const dependencies = await remark.findDependencies(manifestFilePath, { manifest });
  assert.deepEqual(dependencies, ['remark-preset-webpro']);
});
