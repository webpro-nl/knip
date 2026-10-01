import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import rsbuild from '../../src/plugins/rsbuild/index.ts';
import type { RsbuildConfig } from '../../src/plugins/rsbuild/types.ts';
import type { PluginOptions } from '../../src/types/config.ts';
import { toProductionEntry } from '../../src/util/input.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rsbuild');

const pluginOptions: PluginOptions = {
  cwd,
  rootCwd: cwd,
  manifest: {},
  rootManifest: {},
  manifestScriptNames: new Set(),
  config: { config: null, entry: null, project: null },
  configFileDir: cwd,
  configFileName: 'rsbuild.config.ts',
  configFilePath: resolve('fixtures/plugins/rsbuild/rsbuild.config.ts'),
  isProduction: false,
  enabledPlugins: [],
  getInputsFromScripts: () => [],
};

test('Preserve static source entries when a Rspack callback throws', async () => {
  const nodeEnv = process.env.NODE_ENV;
  const config: RsbuildConfig = {
    source: { entry: { app: './app-entry.ts' }, preEntry: './pre-entry-1.ts' },
    environments: {
      worker: {
        source: { entry: { worker: { import: ['./worker-entry.ts'] } }, preEntry: ['./pre-entry-2.ts'] },
      },
    },
    tools: {
      rspack: () => {
        throw new Error('Cannot resolve Rspack configuration');
      },
    },
  };
  assert(rsbuild.resolveConfig);
  const inputs = await rsbuild.resolveConfig(config, pluginOptions);

  assert.equal(process.env.NODE_ENV, nodeEnv);
  assert.deepEqual(inputs, [
    toProductionEntry('./app-entry.ts'),
    toProductionEntry('./pre-entry-1.ts'),
    toProductionEntry('./worker-entry.ts'),
    toProductionEntry('./pre-entry-2.ts'),
  ]);
});

test('Read object and callback inputs from a tools.rspack array', async () => {
  const config: RsbuildConfig = {
    source: { entry: { app: './app-entry.ts' }, preEntry: './pre-entry-1.ts' },
    tools: {
      rspack: [
        { module: { rules: [{ loader: 'array-loader' }] } },
        config => {
          config.entry = { worker: { import: ['./worker-entry.ts'] } };
        },
      ],
    },
  };
  assert(rsbuild.resolveConfig);
  const inputs = await rsbuild.resolveConfig(config, pluginOptions);

  assert(inputs.some(input => input.specifier.endsWith('/worker-entry.ts')));
  assert(inputs.some(input => input.specifier === 'array-loader'));
  assert(inputs.some(input => input.specifier.endsWith('/app-entry.ts')));
  assert(inputs.some(input => input.specifier.endsWith('/pre-entry-1.ts')));
});

test('Find dependencies with the rsbuild plugin', async () => {
  const nodeEnv = process.env.NODE_ENV;
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.equal(process.env.NODE_ENV, nodeEnv);
  assert(issues.unresolved['rsbuild.config.ts']['missing-loader']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    unresolved: 1,
    processed: 14,
    total: 14,
  });
});

test('Find dependencies with the rsbuild plugin (production)', async () => {
  const nodeEnv = process.env.NODE_ENV;
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.equal(process.env.NODE_ENV, nodeEnv);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 13,
    total: 13,
  });
});
