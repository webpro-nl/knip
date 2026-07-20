import assert from 'node:assert/strict';
import test from 'node:test';
import { _getInputsFromScripts } from '../../src/binaries/index.ts';
import { main } from '../../src/index.ts';
import { toBinary, toDependency, toProductionEntry } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/tsdown-cli');

test('Discover tsdown CLI entries', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/library.ts' in issues.files));
  assert(!('src/modules/nested.ts' in issues.files));
  assert('src/orphan.ts' in issues.files);
  assert.deepEqual(issues.exports, {});

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Parse tsdown CLI arguments', () => {
  const manifest = createManifest({ devDependencies: { tsdown: '*' } });
  const options = {
    rootCwd: cwd,
    cwd,
    manifest,
    rootManifest: manifest,
    getManifest: () => undefined,
    containingFilePath: join(cwd, 'package.json'),
  };

  for (const mode of ['inline', 'hidden']) {
    assert.deepEqual(_getInputsFromScripts(`tsdown --sourcemap ${mode} src/library.ts`, options), [
      toBinary('tsdown'),
      toProductionEntry('src/library.ts', { allowIncludeExports: true }),
    ]);
  }
  assert.deepEqual(_getInputsFromScripts('tsdown --sourcemap src/library.ts', options), [
    toBinary('tsdown'),
    toProductionEntry('src/library.ts', { allowIncludeExports: true }),
  ]);

  assert.deepEqual(_getInputsFromScripts('tsdown --watch src', options), [toBinary('tsdown')]);
  assert.deepEqual(_getInputsFromScripts('tsdown src/library.ts --watch', options), [
    toBinary('tsdown'),
    toProductionEntry('src/library.ts', { allowIncludeExports: true }),
  ]);

  for (const subcommand of ['create', 'migrate']) {
    assert.deepEqual(_getInputsFromScripts(`tsdown ${subcommand}`, options), [toBinary('tsdown')]);
  }

  for (const flag of ['--failOnWarn', '--deps.skipNodeModulesBundle', '--silent']) {
    assert.deepEqual(_getInputsFromScripts(`tsdown ${flag} src/library.ts`, options), [
      toBinary('tsdown'),
      toProductionEntry('src/library.ts', { allowIncludeExports: true }),
    ]);
  }

  for (const flag of ['--entry', '--entry.library']) {
    assert.deepEqual(_getInputsFromScripts(`tsdown ${flag} src/library.ts`, options), [
      toBinary('tsdown'),
      toProductionEntry('src/library.ts', { allowIncludeExports: true }),
    ]);
  }

  for (const flag of ['--deps.never-bundle', '--deps.neverBundle', '--external']) {
    assert.deepEqual(_getInputsFromScripts(`tsdown ${flag} react src/library.ts`, options), [
      toBinary('tsdown'),
      toProductionEntry('src/library.ts', { allowIncludeExports: true }),
      toDependency('react', { optional: true }),
    ]);
  }

  assert.deepEqual(_getInputsFromScripts('tsdown --publint --attw src/library.ts', options), [
    toBinary('tsdown'),
    toProductionEntry('src/library.ts', { allowIncludeExports: true }),
    toDependency('publint', { optional: true }),
    toDependency('@arethetypeswrong/core', { optional: true }),
  ]);
});
