import { isAbsolute, join } from '../../util/path.ts';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { LunariaConfig } from './types.ts';

const title = 'Lunaria';

const enablers = ['@lunariajs/core', '@lunariajs/starlight'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['lunaria.config.json'];

const resolveConfig: ResolveConfig<LunariaConfig> = async (localConfig, options) => {
  if (!localConfig) return [];
  const files = localConfig.files?.map(f => f.location) ?? [];
  const renderer = localConfig.renderer ? [localConfig.renderer] : [];
  const customCss = localConfig.dashboard?.customCss ?? [];
  const favicon = localConfig.dashboard?.favicon?.inline ? [localConfig.dashboard.favicon.inline] : [];

  const baseDir = options.configFileDir;

  return [...files, ...renderer, ...customCss, ...favicon].map(id =>
    toProductionEntry(isAbsolute(id) ? id : join(baseDir, id))
  );
};

const args: Args = {
  binaries: ['lunaria'],
  config: ['config'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
