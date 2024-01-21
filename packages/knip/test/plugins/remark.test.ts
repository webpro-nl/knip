import assert from 'node:assert/strict';
import test from 'node:test';
import { default as remark } from '../../src/plugins/remark/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/remark');
const manifestFilePath = join(cwd, 'package.json');
const options = buildOptions(cwd);

test('Find dependencies in Remark configuration', async () => {
  const dependencies = await remark.findDependencies(manifestFilePath, options);
  assert.deepEqual(dependencies, ['remark-preset-webpro']);
});
