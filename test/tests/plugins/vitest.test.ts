import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as vitest from '../../../src/plugins/vitest/index.js';
import { getManifest } from '../../helpers/index.js';

const cwd = path.resolve('test/fixtures/plugins/vitest');
const manifest = getManifest(cwd);

test('Find dependencies in vitest configuration (vitest)', async () => {
  const configFilePath = path.join(cwd, 'vitest.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['happy-dom', '@vitest/coverage-istanbul']);
});

test('Find dependencies in vitest configuration (vite)', async () => {
  const configFilePath = path.join(cwd, 'vite.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, ['@edge-runtime/vm', '@vitest/coverage-c8']);
});
