import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { TsupConfig } from './types.js';

// https://paka.dev/npm/tsup/api

const title = 'tsup';

const enablers = ['tsup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsup.config.{js,ts,cjs,json}', 'package.json'];

const resolveConfig: ResolveConfig<TsupConfig> = async config => {
  if (typeof config === 'function') config = await config({});

  const entryPatterns = [config]
    .flat()
    .flatMap(config => {
      if (!config.entry) return [];
      if (Array.isArray(config.entry)) return config.entry;
      return Object.values(config.entry);
    })
    .filter(entry => !entry.startsWith('!'))
    .map(toEntryPattern);

  return entryPatterns;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;
