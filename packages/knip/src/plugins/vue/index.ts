import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import type { VueConfig, WebpackConfiguration } from './types.js';

// https://cli.vuejs.org/config/
// https://vuejs.org/guide/scaling-up/tooling.html#vue-cli

const title = 'Vue';

const enablers = ['vue'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vue.config.{js,ts}'];

const resolveConfig: ResolveConfig<VueConfig> = async (config, options) => {
  const { cwd, isProduction, manifest } = options;

  const deps: string[] = [];

  if (config.configureWebpack) {
    const baseConfig = {
      mode: 'development',
      entry: {},
      resolve: {},
      plugins: [],
      module: { rules: [] },
    } satisfies WebpackConfiguration;
    const modifiedConfig =
      typeof config.configureWebpack === 'function' ? config.configureWebpack(baseConfig) : config.configureWebpack;
    const { dependencies } = await findWebpackDependenciesFromConfig({
      config: modifiedConfig ?? baseConfig,
      cwd,
    });
    for (const dependency of dependencies) deps.push(dependency);
  }

  if (
    !isProduction &&
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)vue-cli-service(\s|\s.+\s)lint(?=\s|$)/.test(script))
  ) {
    deps.push('@vue/cli-plugin-eslint');
  }

  return deps;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
