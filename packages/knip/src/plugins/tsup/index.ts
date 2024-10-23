import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { TsupConfig } from './types.js';

// https://paka.dev/npm/tsup/api
// https://github.com/egoist/tsup/blob/dev/src/load.ts

const title = 'tsup';

const enablers = ['tsup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsup.config.{js,ts,cjs,mjs,json}', 'package.json'];

const resolveConfig: ResolveConfig<TsupConfig> = async config => {
  if (typeof config === 'function') config = await config({});

  const entryPatterns = [config]
    .flat()
    .flatMap(config => {
      if (!config.entry) return [];
      if (Array.isArray(config.entry)) return config.entry;
      return Object.values(config.entry);
    })
    .map(id => toProductionEntry(id));

  return entryPatterns;
};

const args = {
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
} satisfies Plugin;
