import assert from 'node:assert/strict';
import test from 'node:test';
import { default as stylelint } from '../../src/plugins/stylelint/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/stylelint');
const options = buildOptions(cwd);

test('Find dependencies in stylelint configuration (json)', async () => {
  const configFilePath = join(cwd, '.stylelintrc');
  const dependencies = await stylelint.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, [
    'stylelint-config-standard',
    'stylelint-order',
    'stylelint-config-html/html',
    'stylelint-config-standard',
  ]);
});
