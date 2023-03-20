import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as commitizen from '../../../src/plugins/commitizen/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/commitizen');
const manifest = getManifest(cwd);

test('Find dependencies in commitizen configuration (package.json)', async () => {
  const configFilePath = path.join(cwd, 'package.json');
  const dependencies = await commitizen.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['cz-conventional-changelog']);
});

test('Find dependencies in commitizen configuration (.czrc)', async () => {
  const configFilePath = path.join(cwd, '.czrc');
  const dependencies = await commitizen.findDependencies(configFilePath, {});
  assert.deepEqual(dependencies, ['cz-conventional-changelog']);
});
