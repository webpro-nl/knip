import assert from 'node:assert/strict';
import test from 'node:test';
import { _getInputsFromScripts } from '../../src/binaries/index.ts';
import { toBinary, toDeferResolve, toDeferResolveEntry, toDependency } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/binaries');
const optional = { optional: true };
const inputs = (script: string) =>
  _getInputsFromScripts(script, {
    cwd,
    rootCwd: cwd,
    containingFilePath: join(cwd, 'package.json'),
    manifest: createManifest({}),
    rootManifest: undefined,
    getManifest: () => undefined,
    optionalBinaries: true,
  });

for (const flag of ['--no', '--no-install', '--yes=false', '--no-yes']) {
  test(`npx ${flag} requires its executable provider`, () => {
    assert.deepEqual(inputs(`npx ${flag} custom-build-cli`), [toBinary('custom-build-cli')]);
  });
}

test('npx no-install flags after the executable belong to the executable', () => {
  for (const flag of ['--no', '--no-install', '--yes=false', '--no-yes']) {
    assert.deepEqual(inputs(`npx custom-build-cli ${flag}`), [toBinary('custom-build-cli', optional)]);
  }
});

test('npx no-install preserves package, module, file and sibling references', () => {
  assert.deepEqual(inputs('npx --no-install custom-provider@1'), [toDependency('custom-provider')]);
  assert.deepEqual(inputs('npx --no-install node --import import-hook ./script.js && custom-build-cli'), [
    toBinary('node'),
    toDeferResolveEntry('./script.js', optional),
    toDeferResolve('import-hook'),
    toBinary('custom-build-cli', optional),
  ]);
  assert.deepEqual(inputs('npx custom-build-cli'), [toBinary('custom-build-cli', optional)]);
  assert.deepEqual(inputs('npx --yes custom-build-cli'), [toBinary('custom-build-cli', optional)]);
});
