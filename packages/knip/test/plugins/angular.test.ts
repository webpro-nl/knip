import assert from 'node:assert/strict';
import test from 'node:test';
import { default as angular } from '../../src/plugins/angular/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/angular');
const options = buildOptions(cwd);

test('Find dependencies in angular configuration (json)', async () => {
  const configFilePath = join(cwd, 'angular.json');
  const dependencies = await angular.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['@angular-devkit/build-angular', join(cwd, 'src/main.ts'), 'jasmine']);
});
