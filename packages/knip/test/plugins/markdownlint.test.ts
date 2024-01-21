import assert from 'node:assert/strict';
import test from 'node:test';
import { default as markdownlint } from '../../src/plugins/markdownlint/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/markdownlint');
const options = buildOptions(cwd);

test('Find dependencies in markdownlint configuration (json)', async () => {
  const configFilePath = join(cwd, '.markdownlint.json');
  const dependencies = await markdownlint.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['markdownlint/style/prettier', 'rule-package']);
});
