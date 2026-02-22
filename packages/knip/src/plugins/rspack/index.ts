import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { findWebpackDependenciesFromConfig } from '../webpack/index.ts';
import type { WebpackConfig } from '../webpack/types.ts';

// https://rspack.rs/config/

const title = 'Rspack';

const enablers = ['@rspack/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rspack.config*.{js,ts,mjs,mts,cjs,cts}'];

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const inputs = await findWebpackDependenciesFromConfig(localConfig, options);

  return inputs.filter(input => !input.specifier.startsWith('builtin:'));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
