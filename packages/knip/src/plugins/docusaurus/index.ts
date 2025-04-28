import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { ConfigItem, DocusaurusConfig } from './types.js';

// https://docusaurus.io/docs/configuration

const title = 'Docusaurus';

const enablers = ['@docusaurus/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['docusaurus.config.{js,ts}'];

const entry: string[] = [];

const production: string[] = [];

const resolveConfigItem = (item: ConfigItem): string | null => {
  if (!item) return null;
  if (Array.isArray(item)) return item[0];
  return item;
};

const resolveConfig: ResolveConfig<DocusaurusConfig> = async config => {
  const themes = (config?.themes ?? []).map(resolveConfigItem);
  const plugins = (config?.plugins ?? []).map(resolveConfigItem);
  const presets = (config?.presets ?? []).map(resolveConfigItem);

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
