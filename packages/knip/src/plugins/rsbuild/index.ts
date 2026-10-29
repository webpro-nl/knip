import type { Configuration } from 'webpack';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolveConfig as resolveRspackConfig } from '../rspack/index.ts';
import type { AliasChain, RsbuildConfig, RsbuildConfigOrFn } from './types.ts';

// https://rsbuild.rs/config/

const title = 'Rsbuild';

const enablers = ['@rsbuild/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rsbuild*.config.{mjs,ts,js,cjs,mts,cts}'];

// https://rsbuild.rs/guide/configuration/rsbuild#export-function
const configParams = [
  { env: 'development', command: 'dev', envMode: 'development' },
  { env: 'production', command: 'build', envMode: 'production' },
];

const getConfigs = async (configOrFn: RsbuildConfigOrFn) => {
  if (typeof configOrFn !== 'function') return [configOrFn];
  const configs: RsbuildConfig[] = [];
  for (const params of configParams) configs.push(await configOrFn(params));
  return configs;
};

const getAliases = (chain: AliasChain) => {
  const aliases: Record<string, string[]> = {};
  for (const item of [chain].flat()) {
    if (typeof item === 'function') continue;
    for (const key in item) {
      const targets: string[] = [];
      for (const target of [item[key]].flat()) if (typeof target === 'string') targets.push(target);
      if (targets.length > 0) aliases[key] = targets;
    }
  }
  return aliases;
};

const resolveConfig: ResolveConfig<RsbuildConfigOrFn> = async (configOrFn, options) => {
  const entries = new Set<string>();
  const inputs: Input[] = [];

  const checkSource = (source: RsbuildConfig['source']) => {
    if (source?.entry) {
      for (const entry of Object.values(source.entry)) {
        if (typeof entry === 'string') entries.add(entry);
        else if (Array.isArray(entry)) for (const e of entry) entries.add(e);
        else {
          if (typeof entry.import === 'string') entries.add(entry.import);
          else if (Array.isArray(entry.import)) for (const e of entry.import) entries.add(e);
        }
      }
    }

    if (source?.preEntry) {
      const entry = source.preEntry;
      if (typeof entry === 'string') entries.add(entry);
      else if (Array.isArray(entry)) for (const e of entry) entries.add(e);
    }
  };

  const checkConfig = async (localConfig: RsbuildConfig, config: RsbuildConfig) => {
    checkSource(localConfig.source);

    const alias = localConfig.resolve?.alias;
    if (alias) {
      for (const input of await resolveRspackConfig({ resolve: { alias: getAliases(alias) } }, options)) {
        inputs.push(input);
      }
    }

    if (!localConfig.tools?.rspack) return;
    const target = localConfig.output?.target ?? config.output?.target ?? 'web';
    const mode = localConfig.mode ?? config.mode;
    const passes = mode ? [mode === 'production'] : options.isProduction ? [true] : [false, true];

    for (const rspack of [localConfig.tools.rspack].flat()) {
      for (const isProduction of typeof rspack === 'function' ? passes : [options.isProduction]) {
        const baseConfig = {
          mode: mode ?? (isProduction ? 'production' : 'development'),
          entry: {},
          resolve: { alias: {} },
          module: { rules: [] },
          plugins: [],
        } satisfies Configuration;
        const utils = {
          env: process.env.NODE_ENV ?? '',
          isDev: baseConfig.mode === 'development',
          isProd: baseConfig.mode === 'production',
          target,
          isServer: target === 'node',
          isWebWorker: target === 'web-worker',
        };
        const resolvedConfig = typeof rspack === 'function' ? await rspack(baseConfig, utils) : rspack;
        const resolvedInputs = await resolveRspackConfig(resolvedConfig ?? baseConfig, {
          ...options,
          isProduction: options.isProduction || isProduction,
        });
        for (const input of resolvedInputs) inputs.push(input);
      }
    }
  };

  for (const config of await getConfigs(configOrFn)) {
    await checkConfig(config, config);

    if (config.environments) {
      for (const environment of Object.values(config.environments)) {
        await checkConfig(environment, config);
      }
    }
  }

  for (const entry of entries) inputs.push(toProductionEntry(entry));
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
