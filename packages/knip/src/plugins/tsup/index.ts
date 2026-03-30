import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getEntryFromAST } from './resolveFromAST.ts';
import type { TsupConfig } from './types.ts';

// https://paka.dev/npm/tsup/api
// https://github.com/egoist/tsup/blob/dev/src/load.ts

const title = 'tsup';

const enablers = ['tsup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsup.config.{js,ts,cjs,mjs,json}', 'package.json'];

const isLoadConfig: IsLoadConfig = ({ configFileName }) =>
  configFileName === 'package.json' || configFileName.endsWith('.json');

const resolveConfig: ResolveConfig<TsupConfig> = async config => {
  if (typeof config === 'function') config = await config({});

  const entryPatterns = [config]
    .flat()
    .flatMap(config => {
      if (!config.entry) return [];
      if (Array.isArray(config.entry)) return config.entry;
      return Object.values(config.entry);
    })
    .map(id => toProductionEntry(id, { allowIncludeExports: true }));

  return entryPatterns;
};

const resolveFromAST: ResolveFromAST = program => {
  const entries = getEntryFromAST(program);
  return [...entries].map(id => toProductionEntry(id, { allowIncludeExports: true }));
};

const args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
  args,
};

export default plugin;
