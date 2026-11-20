import assert from 'node:assert/strict';
import test from 'node:test';
import { _getInputsFromScripts } from '../../src/binaries/index.ts';
import { main } from '../../src/index.ts';
import { toBinary, toConfig, toEntry } from '../../src/util/input.ts';
import { createManifest } from '../../src/util/package-json.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/tsup');

test('Find dependencies with the tsup plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 14,
    total: 14,
  });
});

test('Parse tsup CLI arguments', () => {
  const manifest = createManifest({ devDependencies: { tsup: '*' } });
  const options = {
    rootCwd: cwd,
    cwd,
    manifest,
    rootManifest: manifest,
    getManifest: () => undefined,
    containingFilePath: join(cwd, 'package.json'),
  };
  const entry = toEntry('entry-8.ts', { production: true, allowIncludeExports: true });

  assert.deepEqual(_getInputsFromScripts('tsup --clean entry-8.ts', options), [toBinary('tsup'), entry]);
  assert.deepEqual(_getInputsFromScripts('tsup --keep-names entry-8.ts', options), [toBinary('tsup')]);
  assert.deepEqual(_getInputsFromScripts('tsup --config custom.ts entry-8.ts', options), [
    toBinary('tsup'),
    toConfig('tsup', 'custom.ts'),
    entry,
  ]);
});
