import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as markdownlint from '../../src/plugins/markdownlint/index.js';
import { getManifest } from '../helpers/index.js';

const cwd = path.resolve('tests/fixtures/plugins/markdownlint');
const manifest = getManifest(cwd);

test('Find dependencies in markdownlint configuration (json)', async () => {
  const configFilePath = path.join(cwd, '.markdownlint.json');
  const dependencies = await markdownlint.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['markdownlint', 'rule-package']);
});
