import assert from 'node:assert/strict';
import test from 'node:test';
import * as typescript from '../../src/plugins/typescript/index.js';
import { resolve, join } from '../../src/util/path.js';

const cwd = resolve('fixtures/plugins/typescript');

test('Find dependencies in typescript configuration (json)', async () => {
  const configFilePath = join(cwd, 'tsconfig.json');
  const dependencies = await typescript.findDependencies(configFilePath);
  assert.deepEqual(dependencies, [
    '@tsconfig/node16/tsconfig.json',
    'typescript-eslint-language-service',
    'ts-graphql-plugin',
    'tslib',
  ]);
});
