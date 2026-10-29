import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import rsbuild from '../../src/plugins/rsbuild/index.ts';
import type { RsbuildConfig } from '../../src/plugins/rsbuild/types.ts';
import type { PluginOptions } from '../../src/types/config.ts';
import { isAlias } from '../../src/util/input.ts';
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

test('Propagate Rspack callback errors instead of returning partial inputs', async () => {
  const error = new Error('Cannot resolve Rspack configuration');
  const config: RsbuildConfig = {
    source: { entry: { app: './app-entry.ts' }, preEntry: './pre-entry-1.ts' },
    tools: {
      rspack: [
        { entry: './worker-entry.ts' },
        () => {
          throw error;
        },
      ],
    },
  };
  const resolveConfig = rsbuild.resolveConfig;
  assert(resolveConfig);
  await assert.rejects(async () => resolveConfig(config, pluginOptions), error);
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

const getAliases = async (config: RsbuildConfig) => {
  assert(rsbuild.resolveConfig);
  const inputs = await rsbuild.resolveConfig(config, pluginOptions);
  return inputs.filter(isAlias).map(({ specifier, prefixes }) => ({ specifier, prefixes }));
};

const envAliases = [
  { specifier: '@env', prefixes: ['./src/env.ts'] },
  { specifier: '@env/*', prefixes: ['src/env.ts/*'] },
];

test('Read resolve.alias as an object', async () => {
  const aliases = await getAliases({ resolve: { alias: { '@env': './src/env.ts' } } });
  assert.deepEqual(aliases, envAliases);
});

test('Read resolve.alias as a chain of an object and a function', async () => {
  const aliases = await getAliases({ resolve: { alias: [{ '@env': './src/env.ts' }, alias => alias] } });
  assert.deepEqual(aliases, envAliases);
});

test('Skip resolve.alias targets that are false', async () => {
  const aliases = await getAliases({ resolve: { alias: { '@env': './src/env.ts', '@off': false } } });
  assert.deepEqual(aliases, envAliases);
});

test('Skip false in resolve.alias array targets', async () => {
  const aliases = await getAliases({ resolve: { alias: { '@env': ['./src/env.ts', false], '@none': [false] } } });
  assert.deepEqual(aliases, envAliases);
});

test('Skip resolve.alias targets that are not strings', async () => {
  const alias = { '@env': './src/env.ts', '@maybe': undefined } as unknown as RsbuildConfig['resolve'];
  const aliases = await getAliases({ resolve: { alias } } as RsbuildConfig);
  assert.deepEqual(aliases, envAliases);
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
