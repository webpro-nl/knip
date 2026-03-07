import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/webpack-reexport');

test('Handle re-exported webpack config', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(!issues.unlisted?.['webpack.config.js']?.['style-loader']);
  assert(!issues.unlisted?.['webpack.config.js']?.['css-loader']);

  assert.deepEqual(
    configurationHints.filter(hint => hint.type === 'ignoreDependencies'),
    [{ type: 'ignoreDependencies', workspaceName: '.', identifier: 'style-loader' }]
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    processed: 2,
    total: 2,
  });
});

test('Handle re-exported webpack config (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters, configurationHints } = await main(options);

  assert(!issues.unlisted?.['webpack.config.js']?.['style-loader']);
  assert(!issues.unlisted?.['webpack.config.js']?.['css-loader']);

  assert.deepEqual(
    configurationHints.filter(hint => hint.type === 'ignoreDependencies'),
    [{ type: 'ignoreDependencies', workspaceName: '.', identifier: 'style-loader' }]
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
