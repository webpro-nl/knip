import assert from 'node:assert/strict';
import test from 'node:test';
import * as _template from '../../src/plugins/_template/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('tests/fixtures/plugins/_template');
const manifest = getManifest(cwd);

test('Find dependencies in _template configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await _template.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, []);
});
