import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import maestro from '../../src/plugins/maestro/index.ts';
import { loadFile } from '../../src/util/fs.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/maestro');

test('Decode Maestro YAML documents', async () => {
  assert.deepEqual(await maestro.parseConfig!(await loadFile(resolve('fixtures/load-yaml-multi/flow.yaml'))), [
    { appId: 'com.example' },
    ['launchApp', { runScript: 'script.js' }],
  ]);
  assert.deepEqual(await maestro.parseConfig!(await loadFile(resolve('fixtures/load-yaml-multi/config.yaml'))), [
    { flows: ['*'] },
  ]);
});

test('Find scripts run by flows with the Maestro plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('.maestro/scripts/unused.js' in issues.files);
  assert('shared/unused.js' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 11,
    total: 11,
  });
});

test('Enable the Maestro plugin with flows only in subdirectories', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/maestro-nested') });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
