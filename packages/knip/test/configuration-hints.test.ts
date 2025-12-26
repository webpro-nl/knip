import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/configuration-hints');

test('Provide configuration hints', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.files.has(join(cwd, 'src/entry.js')));

  assert.deepEqual(configurationHints, [
    { type: 'entry-top-level', identifier: '[src/entry.js]' },
    { type: 'project-top-level', identifier: '[src/**]' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});

test('Provide configuration hints for patterns covered by plugins and project redundancy', async () => {
  const cwd = resolve('fixtures/configuration-hints-plugin');
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'entry-redundant', identifier: 'create-typescript-app.config.js', workspaceName: '.' },
    { type: 'entry-redundant', identifier: 'svgo.config.mjs', workspaceName: '.' },
    { type: 'project-redundant', identifier: 'create-typescript-app.config.js', workspaceName: '.' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    processed: 2,
    total: 2,
  });
});

test('No hints when user overrides plugin entry config', async () => {
  const cwd = resolve('fixtures/configuration-hints-plugin-override');
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'entry-redundant', identifier: 'svgo.config.js', workspaceName: '.' },
    { type: 'entry-redundant', identifier: 'yarn.config.cjs', workspaceName: '.' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 3,
    processed: 3,
    total: 3,
  });
});
