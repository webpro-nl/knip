import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/metro');

test('Find dependencies with the Metro plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['react']);
  assert(issues.dependencies['package.json']['react-native']);

  assert(issues.unresolved['metro.config.js']['metro-minify-esbuild']);
  assert(issues.unresolved['package.json']['./custom-metro-transformer.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    unresolved: 2,
    processed: 2,
    total: 2,
  });
});
