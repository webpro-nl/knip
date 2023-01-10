import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as _template from '../../../src/plugins/_template/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/_template');
const manifest = getManifest(cwd);

test('Find dependencies in _template configuration (json)', async () => {
  const configFilePath = path.join(cwd, 'package.json');
  const dependencies = await _template.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, []);
});
