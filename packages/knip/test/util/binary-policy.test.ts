import assert from 'node:assert/strict';
import test from 'node:test';
import { _getInputsFromScripts } from '../../src/binaries/index.ts';
import type { GetInputsFromScriptsOptions } from '../../src/types/config.ts';
import { toBinary, toConfig, toDeferResolve, toDeferResolveEntry } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/binaries');
const optional = { optional: true };
const inputs = (script: string, options: Partial<GetInputsFromScriptsOptions> = {}) =>
  _getInputsFromScripts(script, {
    cwd,
    rootCwd: cwd,
    containingFilePath: join(cwd, 'package.json'),
    manifest: createManifest({}),
    rootManifest: undefined,
    getManifest: () => undefined,
    optionalBinaries: true,
    ...options,
  });

test('Ambient commands retain optional binary candidates regardless of parser registration', () => {
  assert.deepEqual(inputs('custom-build-cli && eslint . && biome check .'), [
    toBinary('custom-build-cli', optional),
    toBinary('eslint', optional),
    toBinary('biome', optional),
  ]);
});

test('Wrappers preserve optional ambient executable references', () => {
  for (const wrapper of ['cross-env', 'c8']) {
    assert.deepEqual(inputs(`${wrapper} custom-build-cli`), [
      toBinary(wrapper, optional),
      toBinary('custom-build-cli', optional),
    ]);
  }
  assert.deepEqual(inputs('find . -exec custom-build-cli {} \\;'), [
    toBinary('find', optional),
    toBinary('custom-build-cli', optional),
  ]);
});

test('Optional executable references preserve explicit module, file and config references', () => {
  assert.deepEqual(inputs('node --import import-hook ./script.js'), [
    toBinary('node', optional),
    toDeferResolveEntry('./script.js', optional),
    toDeferResolve('import-hook'),
  ]);
  assert.deepEqual(inputs('NODE_OPTIONS="--import import-hook" custom-build-cli'), [
    toBinary('custom-build-cli', optional),
    toDeferResolve('import-hook'),
  ]);
  assert.deepEqual(inputs('vitest --config ./vitest.custom.ts'), [
    toBinary('vitest', optional),
    toConfig('vitest', './vitest.custom.ts'),
  ]);
});

test('Explicit local binary paths require a provider in ambient commands', () => {
  assert.deepEqual(inputs('./node_modules/.bin/custom-build-cli'), [toBinary('custom-build-cli')]);
  assert.deepEqual(inputs('node_modules/.bin/custom-build-cli'), [toBinary('custom-build-cli')]);
});

test('Package-manager execution establishes the child executable policy', () => {
  for (const command of ['pnpm exec', 'pnpm', 'yarn exec', 'yarn']) {
    assert.deepEqual(inputs(`${command} custom-build-cli`), [toBinary('custom-build-cli')]);
  }
  assert.deepEqual(inputs('pnpm exec c8 custom-build-cli'), [toBinary('c8'), toBinary('custom-build-cli')]);
  assert.deepEqual(inputs('cross-env custom-build-cli && pnpm exec custom-build-cli'), [
    toBinary('cross-env', optional),
    toBinary('custom-build-cli', optional),
    toBinary('custom-build-cli'),
  ]);
  assert.deepEqual(inputs('npm exec -- custom-build-cli'), [toBinary('custom-build-cli', optional)]);
  assert.deepEqual(inputs('npx --yes custom-build-cli'), [toBinary('custom-build-cli', optional)]);
});

test('Speculative forwarded arguments do not become executable references', () => {
  assert.deepEqual(inputs('custom-build-cli', { isForwardedArgs: true }), []);
  assert.deepEqual(inputs('release-tag --coverage.enabled', { isForwardedArgs: true }), []);
});
