import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { RsbuildConfig, RsbuildConfigExport } from './types.ts';

// https://rsbuild.rs/config/

const title = 'Rsbuild';

const enablers = ['@rsbuild/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rsbuild*.config.{mjs,ts,js,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<RsbuildConfigExport> = async configExport => {
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

  const configs: RsbuildConfig[] = [];
  if (typeof configExport === 'function') {
    for (const command of ['dev', 'build'] as const) {
      configs.push(await configExport({ command }));
    }
  } else if (configExport) {
    configs.push(configExport);
  }

  for (const cfg of configs) {
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
