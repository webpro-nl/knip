import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfig } from '../src/util/config.js';

const importedConfig = { entryFiles: ['index.ts'], projectFiles: ['*.ts'] };

const resolvedConfig = { entryFiles: ['index.ts'], projectFiles: ['*.ts'], dev: false };
const resolvedConfigDev = { entryFiles: ['index.ts'], projectFiles: ['*.ts'], dev: true };

test('resolveConfig (default)', async () => {
  const config = resolveConfig({ ...importedConfig });
  assert.deepEqual(config, resolvedConfig);
});

test('resolveConfig (static)', async () => {
  const config = resolveConfig({ workspace: { ...importedConfig } }, { workingDir: 'workspace' });
  assert.deepEqual(config, resolvedConfig);
});

test('resolveConfig (dynamic)', async () => {
  const config = resolveConfig({ 'packages/*': { ...importedConfig } }, { workingDir: 'packages/a' });
  assert.deepEqual(config, resolvedConfig);
});

test('resolveConfig (dev)', async () => {
  const config = resolveConfig({ dev: { ...importedConfig } }, { isDev: true });
  assert.deepEqual(config, resolvedConfigDev);
});

test('resolveConfig (dev fallback)', async () => {
  const config = resolveConfig({ ...importedConfig }, { isDev: true });
  assert.deepEqual(config, resolvedConfigDev);
});

test('resolveConfig (static dev)', async () => {
  const config = resolveConfig(
    { workspace: { entryFiles: [], projectFiles: [], dev: { ...importedConfig } } },
    { workingDir: 'workspace', isDev: true }
  );
  assert.deepEqual(config, resolvedConfigDev);
});

test('resolveConfig (dynamic dev)', async () => {
  const config = resolveConfig(
    { 'packages/*': { entryFiles: [], projectFiles: [], dev: { ...importedConfig } } },
    { workingDir: 'packages/a', isDev: true }
  );
  assert.deepEqual(config, resolvedConfigDev);
});

test('resolveConfig (not found)', async () => {
  const config = resolveConfig({ 'packages/*': { ...importedConfig } }, { workingDir: 'not-found' });
  assert.equal(config, undefined);
});
