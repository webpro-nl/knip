import type { Configuration } from 'webpack';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { debugLogObject } from '../../util/debug.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolveConfig as resolveRspackConfig } from '../rspack/index.ts';
import type { RsbuildConfig } from './types.ts';

// https://rsbuild.rs/config/

const title = 'Rsbuild';

const enablers = ['@rsbuild/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rsbuild*.config.{mjs,ts,js,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<RsbuildConfig> = async (config, options) => {
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

  const checkConfig = async (localConfig: RsbuildConfig) => {
    checkSource(localConfig.source);

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
        try {
          const resolvedConfig = typeof rspack === 'function' ? await rspack(baseConfig, utils) : rspack;
          const resolvedInputs = await resolveRspackConfig(resolvedConfig ?? baseConfig, {
            ...options,
            isProduction: options.isProduction || isProduction,
          });
          for (const input of resolvedInputs) inputs.push(input);
        } catch (error) {
          debugLogObject('rsbuild', 'Could not resolve tools.rspack', error);
        }
      }
    }
  };

  await checkConfig(config);

  if (config.environments) {
    for (const environment of Object.values(config.environments)) {
      await checkConfig(environment);
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
