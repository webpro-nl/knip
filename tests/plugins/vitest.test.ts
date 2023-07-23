import assert from 'node:assert/strict';
import test from 'node:test';
import * as vitest from '../../src/plugins/vitest/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/vitest');
const manifest = getManifest(cwd);

test('Find dependencies in vitest configuration (vitest)', async () => {
  const configFilePath = join(cwd, 'vitest.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['happy-dom', '@vitest/coverage-istanbul']);
});

test('Find dependencies in vitest configuration (vite)', async () => {
  const configFilePath = join(cwd, 'vite.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['@edge-runtime/vm', '@vitest/coverage-c8']);
});
