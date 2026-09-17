import assert from 'node:assert/strict';
import test from 'node:test';
import { _getInputsFromScripts } from '../../src/binaries/index.ts';
import { toBinary, toDeferResolve, toDependency } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eslint4');

const getOptions = (eslintVersion: string) => {
  const manifest = createManifest({ devDependencies: { eslint: eslintVersion } });
  return {
    rootCwd: cwd,
    cwd,
    manifest,
    rootManifest: manifest,
    getManifest: () => undefined,
    containingFilePath: join(cwd, 'package.json'),
  };
};

test('Parse ESLint CLI formatter arguments', () => {
  const options = getOptions('*');

  for (const builtin of ['stylish', 'json', 'json-with-metadata', 'html']) {
    assert.deepEqual(_getInputsFromScripts(`eslint --format ${builtin} .`, options), [toBinary('eslint')]);
  }

  assert.deepEqual(_getInputsFromScripts('eslint --format codeframe .', options), [
    toBinary('eslint'),
    toDependency('eslint-formatter-codeframe'),
  ]);
  assert.deepEqual(_getInputsFromScripts('eslint -f eslint-formatter-codeframe .', options), [
    toBinary('eslint'),
    toDependency('eslint-formatter-codeframe'),
  ]);
  assert.deepEqual(_getInputsFromScripts('eslint -f @microsoft/sarif -o results.sarif .', options), [
    toBinary('eslint'),
    toDependency('@microsoft/eslint-formatter-sarif'),
  ]);
  assert.deepEqual(_getInputsFromScripts('eslint -f @scope/eslint-formatter-custom .', options), [
    toBinary('eslint'),
    toDependency('@scope/eslint-formatter-custom'),
  ]);
  assert.deepEqual(_getInputsFromScripts('eslint --format ./formatters/custom.js .', options), [
    toBinary('eslint'),
    toDeferResolve('./formatters/custom.js'),
  ]);
  assert.deepEqual(_getInputsFromScripts('eslint --format formatters/custom.js .', options), [
    toBinary('eslint'),
    toDeferResolve('./formatters/custom.js'),
  ]);
  assert.deepEqual(_getInputsFromScripts('eslint --format compact .', options), [
    toBinary('eslint'),
    toDependency('eslint-formatter-compact'),
  ]);
});

test('Parse ESLint CLI formatter arguments (built-in formatters removed in v9)', () => {
  const options = getOptions('8.57.0');

  for (const builtin of ['checkstyle', 'compact', 'jslint-xml', 'junit', 'tap', 'unix', 'visualstudio']) {
    assert.deepEqual(_getInputsFromScripts(`eslint --format ${builtin} .`, options), [toBinary('eslint')]);
  }

  assert.deepEqual(_getInputsFromScripts('eslint --format codeframe .', options), [
    toBinary('eslint'),
    toDependency('eslint-formatter-codeframe'),
  ]);
});
