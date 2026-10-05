import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { RsbuildConfig, RsbuildConfigOrFn } from './types.ts';

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

const getConfigs = async (localConfig: RsbuildConfigOrFn) => {
  if (typeof localConfig !== 'function') return [localConfig];
  const configs: RsbuildConfig[] = [];
  for (const params of configParams) configs.push(await localConfig(params));
  return configs;
};

const resolveConfig: ResolveConfig<RsbuildConfigOrFn> = async localConfig => {
  const entries = new Set<string>();

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

  for (const cfg of await getConfigs(localConfig)) {
    checkSource(cfg.source);

    if (cfg.environments) {
      for (const environment of Object.values(cfg.environments)) {
        checkSource(environment.source);
      }
    }
  }

  return Array.from(entries).map(input => toProductionEntry(input));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
