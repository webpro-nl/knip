import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore/global-binaries');

test('Report global binaries while preserving installed providers, optional inputs and explicit ignores', async () => {
  const { issues, counters, configurationHints } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}).sort(), [
    'awk',
    'custom-build-cli',
    'ditto',
    'docker',
    'dscl',
    'explorer.exe',
    'fc-list',
    'mkfifo',
    'node',
    'plutil',
    'system_profiler',
    'wmic',
    'wsl.exe',
    'wslpath',
    'xclip',
  ]);
  assert.deepEqual(counters, { ...baseCounters, binaries: 15 });
  assert.deepEqual(configurationHints, [{ type: 'ignoreBinaries', workspaceName: '.', identifier: 'unused-ignore' }]);
});

test('Ignore system commands by default while retaining unknown binaries and installed providers', async () => {
  const { issues, counters, configurationHints } = await main(
    await createOptions({ cwd, args: { config: 'knip-default.json' } })
  );

  assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}), ['custom-build-cli']);
  assert.deepEqual(counters, { ...baseCounters, binaries: 1 });
  assert.deepEqual(configurationHints, []);
});
