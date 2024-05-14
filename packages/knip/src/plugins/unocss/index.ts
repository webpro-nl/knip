import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { PluginConfig } from './types.js';

// https://unocss.dev/guide/config-file

const title = 'UnoCSS';

const enablers: EnablerPatterns = ['unocss', /^@unocss\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['uno.config.{js,ts,mjs,mts}', 'unocss.config.{js,ts,mjs,mts}'];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  const dependencies = config?.plugins ?? [];
  return [...dependencies];
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
