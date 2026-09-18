import assert from 'node:assert/strict';
import test from 'node:test';
import { _getInputsFromScripts } from '../../src/binaries/index.ts';
import { toBinary, toConfig, toDeferResolve, toDeferResolveEntry, toDependency } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/binaries');
const inputs = (script: string) =>
  _getInputsFromScripts(script, {
    cwd,
    rootCwd: cwd,
    containingFilePath: join(cwd, 'package.json'),
    manifest: createManifest({}),
    rootManifest: undefined,
    getManifest: () => undefined,
    knownBinsOnly: true,
  });
const optional = { optional: true };

test('npm exec finds custom binaries with optional installation', () => {
  for (const script of [
    'npm exec custom-build-cli',
    'npm exec -- custom-build-cli',
    'npm exec --yes custom-build-cli',
    'npm --yes exec custom-build-cli',
    'npm x custom-build-cli',
    'npm exec -- custom-build-cli -- node script.js',
  ]) {
    assert.deepEqual(inputs(script), [toBinary('custom-build-cli', optional)], script);
  }
  assert.deepEqual(inputs('npm exec --no custom-build-cli'), [toBinary('custom-build-cli')]);
  assert.deepEqual(inputs('npm exec --yes=false custom-build-cli'), [toBinary('custom-build-cli')]);
});

test('npm exec keeps npm options separate from executable arguments', () => {
  assert.deepEqual(inputs('npm exec -p custom-build-cli'), [toBinary('custom-build-cli', optional)]);
  assert.deepEqual(inputs('npm -p exec custom-build-cli'), [toBinary('custom-build-cli', optional)]);
  assert.deepEqual(inputs('npm exec custom-build-cli --package=custom-provider'), [
    toDependency('custom-provider', optional),
    toBinary('custom-build-cli', optional),
  ]);
  assert.deepEqual(inputs('npm exec -- custom-build-cli --package=custom-provider'), [
    toBinary('custom-build-cli', optional),
  ]);
});

test('npm exec accepts explicit packages and versioned specifiers', () => {
  assert.deepEqual(inputs('npm exec --package=custom-provider --package=@scope/helper@1 -- custom-build-cli'), [
    toDependency('custom-provider', optional),
    toDependency('@scope/helper', optional),
    toBinary('custom-build-cli', optional),
  ]);
  assert.deepEqual(inputs('npm exec -- custom-provider@1'), [toDependency('custom-provider', optional)]);
  assert.deepEqual(inputs('npm exec -- @scope/custom-provider@1'), [toDependency('@scope/custom-provider', optional)]);
});

test('npm exec preserves explicit module, file and config references', () => {
  assert.deepEqual(inputs('npm exec -- node --import import-hook ./script.js'), [
    toBinary('node', optional),
    toDeferResolveEntry('./script.js', optional),
    toDeferResolve('import-hook'),
  ]);
  assert.deepEqual(inputs('npm exec -- vitest -c vitest.unit.config.ts'), [
    toBinary('vitest', optional),
    toConfig('vitest', 'vitest.unit.config.ts'),
  ]);
  assert.deepEqual(inputs('npm exec -- tsx@4 ./main.ts'), [
    toDependency('tsx', optional),
    toDeferResolveEntry('./main.ts', optional),
  ]);
  assert.deepEqual(inputs('npm exec -- node ./script.js -- --import import-hook'), [
    toBinary('node', optional),
    toDeferResolveEntry('./script.js', optional),
  ]);
});

test('npm exec call without requested packages executes a project script', () => {
  assert.deepEqual(inputs('npm exec --call "node --import import-hook ./script.js"'), [
    toBinary('node'),
    toDeferResolveEntry('./script.js', optional),
    toDeferResolve('import-hook'),
  ]);
  assert.deepEqual(inputs('npm exec -c "custom-build-cli && another-build-cli"'), [
    toBinary('custom-build-cli'),
    toBinary('another-build-cli'),
  ]);
});

test('npm exec uses the last call without dropping sibling commands', () => {
  assert.deepEqual(inputs('npm exec --call first-build-cli --call last-build-cli'), [toBinary('last-build-cli')]);
  assert.deepEqual(inputs('node ./script.js && npm exec --call first-build-cli -c last-build-cli'), [
    toBinary('node'),
    toDeferResolveEntry('./script.js', optional),
    toBinary('last-build-cli'),
  ]);
});

test('npm exec filters invalid binary names while retaining package version requests', () => {
  assert.deepEqual(inputs('npm exec --no -- tool:sub'), []);
  assert.deepEqual(inputs('npm exec --no -- tool@1'), [toDependency('tool')]);
  assert.deepEqual(inputs('npm exec --no -- tool@*'), [toDependency('tool')]);
  assert.deepEqual(inputs('npm exec --no -- @scope/tool@*'), [toDependency('@scope/tool')]);
});

test('npm exec records packages supplied to a call without guessing binary providers', () => {
  assert.deepEqual(inputs('npm exec --package=custom-provider --call "custom-build-cli"'), [
    toDependency('custom-provider', optional),
  ]);
});

test('npm exec preserves commands returned by package-manager resolvers', () => {
  assert.deepEqual(inputs('npm exec pnpm'), [toBinary('pnpm', optional)]);
  assert.deepEqual(inputs('npm exec pnpm@11'), [toDependency('pnpm', optional)]);
  assert.deepEqual(inputs('npm exec -- pnpm exec custom-build-cli'), [
    toBinary('pnpm', optional),
    toBinary('custom-build-cli'),
  ]);
  assert.deepEqual(inputs('npm exec -- c8 custom-build-cli'), [toBinary('c8', optional), toBinary('custom-build-cli')]);
});
