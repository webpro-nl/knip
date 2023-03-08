import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as NpmPkgJsonLintConfig from '../../src/plugins/npm-package-json-lint/index.js';
import { getManifest } from '../helpers/index.js';

const cwd = path.resolve('tests/fixtures/plugins/npm-package-json-lint');
const manifest = getManifest(cwd);

test('Find dependencies in npm-package-json-lint configuration (json)', async () => {
  const configFilePath = path.join(cwd, '.npmpackagejsonlintrc.json');
  const dependencies = await NpmPkgJsonLintConfig.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['npm-package-json-lint-config-default']);
});
