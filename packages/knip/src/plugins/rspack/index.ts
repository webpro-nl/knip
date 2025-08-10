import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import type { WebpackConfig } from '../webpack/types.js';

// https://rspack.rs/config/

const title = 'Rspack';

const enablers = ['@rspack/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rspack.config*.{js,ts,mjs,mts,cjs,cts}'];

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const inputs = await findWebpackDependenciesFromConfig(localConfig, options);

  return inputs.filter(input => !input.specifier.startsWith('builtin:'));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
