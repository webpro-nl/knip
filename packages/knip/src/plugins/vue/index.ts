import type { IsPluginEnabled, Plugin, RegisterCompilers, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { findWebpackDependenciesFromConfig } from '../webpack/index.ts';
import compiler from './compiler.ts';
import type { VueConfig, WebpackConfiguration } from './types.ts';

// https://cli.vuejs.org/config/
// https://vuejs.org/guide/scaling-up/tooling.html#vue-cli

const title = 'Vue';

const enablers = ['vue'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vue.config.{js,ts,mjs}'];

const resolveConfig: ResolveConfig<VueConfig> = async (config, options) => {
  const { manifest } = options;

  const inputs: Input[] = [];

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
    const inputsFromConfig = await findWebpackDependenciesFromConfig(modifiedConfig ?? baseConfig, options);
    for (const input of inputsFromConfig) inputs.push(input);
  }

  if (
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)vue-cli-service(\s|\s.+\s)lint(?=\s|$)/.test(script))
  ) {
    inputs.push(toDependency('@vue/cli-plugin-eslint'));
  }

  return inputs;
};

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('vue') || hasDependency('nuxt')) registerCompiler({ extension: '.vue', compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  registerCompilers,
};

export default plugin;
