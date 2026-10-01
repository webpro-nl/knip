import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PandaCSSConfig } from './types.ts';

// https://panda-css.com/docs/references/config

const title = 'Panda CSS';

const enablers = ['@pandacss/dev'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['panda.config.{ts,js,mjs,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<PandaCSSConfig> = config => {
  const presets = (config.presets ?? []).filter((preset): preset is string => typeof preset === 'string');
  return [...presets.map(id => toDeferResolve(id)), toDependency('postcss')];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
