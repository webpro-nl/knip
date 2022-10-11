import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfig } from '../src/util/config';

const baseConfig = { entryFiles: ['index.ts'], projectFiles: ['*.ts'] };

test('resolveConfig (default)', async () => {
  const config = resolveConfig({ ...baseConfig });
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (static)', async () => {
  const config = resolveConfig({ workspace: { ...baseConfig } }, { workingDir: 'workspace' });
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (dynamic)', async () => {
  const config = resolveConfig({ 'packages/*': { ...baseConfig } }, { workingDir: 'packages/a' });
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (dev)', async () => {
  const config = resolveConfig({ dev: { ...baseConfig } }, { isDev: true });
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (dev)', async () => {
  const config = resolveConfig({ dev: { ...baseConfig } }, { isDev: true });
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (dev fallback)', async () => {
  const config = resolveConfig({ ...baseConfig }, { isDev: true });
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (static dev)', async () => {
  const config = resolveConfig(
    { workspace: { entryFiles: [], projectFiles: [], dev: { ...baseConfig } } },
    { workingDir: 'workspace', isDev: true }
  );
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (dynamic dev)', async () => {
  const config = resolveConfig(
    { 'packages/*': { entryFiles: [], projectFiles: [], dev: { ...baseConfig } } },
    { workingDir: 'packages/a', isDev: true }
  );
  assert.deepEqual(config, { entryFiles: ['index.ts'], projectFiles: ['*.ts'] });
});

test('resolveConfig (not found)', async () => {
  const config = resolveConfig({ 'packages/*': { ...baseConfig } }, { workingDir: 'not-found' });
  assert.equal(config, undefined);
});
