import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { RsbuildConfig } from './types.js';

// https://rsbuild.dev/config

const title = 'Rsbuild';

const enablers: EnablerPatterns = ['@rsbuild/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rsbuild*.config.{mjs,ts,js,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<RsbuildConfig> = async () => {
  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
