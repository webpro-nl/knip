import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '../../types/config.js';
import { debugLogObject } from '../../util/debug.js';
import { type Input, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { type TanstackRouterPluginConfig, tanstackRouterPluginConfigSchema } from './types.js';
import { getRsbuildPluginConfig, getRspackPluginConfig, getVitePluginConfig, getWebpackPluginConfig } from './utils.js';

// https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing

const title = 'Tanstack Router';

const enablers = ['@tanstack/react-router', '@tanstack/router-plugin', '@tanstack/router-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [
  'tsr.config.json',
  'vite.config.{js,mjs,ts,cjs,mts,cts}',
  'rs{pack,build}.config.{js,mjs,ts,cjs,mts,cts}',
  'webpack.config.{js,mjs,ts,cjs,mts,cts}',
];

const entry: string[] = [];

const production: string[] = [];

const resolveEntryPaths: ResolveEntryPaths<TanstackRouterPluginConfig> = async (config, options) => {
  debugLogObject('*', 'resolveEntryPaths::options', options);

  let resolvedConfig: TanstackRouterPluginConfig | undefined;

  if (options.configFileName === 'tsr.config.json') {
    resolvedConfig = tanstackRouterPluginConfigSchema.parse(config);
  }

  if (options.configFileName.startsWith('vite.config.')) {
    resolvedConfig = getVitePluginConfig(options.configFilePath, options.configFileName);
  }

  if (options.configFileName.startsWith('rspack.config')) {
    resolvedConfig = getRspackPluginConfig(options.configFilePath, options.configFileName);
  }

  if (options.configFileName.startsWith('rsbuild.config')) {
    resolvedConfig = getRsbuildPluginConfig(options.configFilePath, options.configFileName);
  }

  if (options.configFileName.startsWith('webpack.config')) {
    resolvedConfig = getWebpackPluginConfig(options.configFilePath, options.configFileName);
  }

  if (resolvedConfig) {
    const entries = [
      toEntry(resolvedConfig.generatedRouteTree),
      toEntry(`${resolvedConfig.routesDirectory}/**/${resolvedConfig.routeFilePrefix ?? ''}*`),
      toEntry(`!${resolvedConfig.routesDirectory}/**/${resolvedConfig.routeFileIgnorePrefix}*`),
    ] satisfies Input[];

    if (resolvedConfig.routeFileIgnorePattern) {
      entries.push(toEntry(`!${resolvedConfig.routesDirectory}/**/*${resolvedConfig.routeFileIgnorePattern}*`));
    }

    return entries;
  }

  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveEntryPaths,
} satisfies Plugin;
