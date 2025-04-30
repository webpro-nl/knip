import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { resolveConfigItem } from './helpers.js';
import type { DocusaurusConfig } from './types.js';

// https://docusaurus.io/docs/configuration

const title = 'Docusaurus';

const enablers = ['@docusaurus/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['docusaurus.config.{js,ts}'];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<DocusaurusConfig> = async config => {
  const themes = (config?.themes ?? []).map(item => resolveConfigItem(item, 'theme'));
  const plugins = (config?.plugins ?? []).map(item => resolveConfigItem(item, 'plugin'));
  const presets = (config?.presets ?? []).map(item => resolveConfigItem(item, 'preset'));

  return [...themes, ...plugins, ...presets]
    .filter((item): item is string => typeof item === 'string')
    .map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
} satisfies Plugin;
