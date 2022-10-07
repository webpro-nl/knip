import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfig } from '../src/util/config';

const baseConfig = { entryFiles: ['index.ts'], filePatterns: ['*.ts'] };

test('resolveConfig (default)', async () => {
  const config = resolveConfig({ ...baseConfig });
  assert.deepEqual(config, { entryFiles: ['index.ts'], filePatterns: ['*.ts'] });
});

test('resolveConfig (static)', async () => {
  const config = resolveConfig({ workspace: { ...baseConfig } }, 'workspace');
  assert.deepEqual(config, { entryFiles: ['index.ts'], filePatterns: ['*.ts'] });
});

test('resolveConfig (dynamic)', async () => {
  const config = resolveConfig({ 'packages/*': { ...baseConfig } }, 'packages/a');
  assert.deepEqual(config, { entryFiles: ['index.ts'], filePatterns: ['*.ts'] });
});
