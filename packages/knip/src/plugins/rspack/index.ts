import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import type { WebpackConfig } from '../webpack/types.js';

// https://www.rspack.dev/config

const title = 'Rspack';

const enablers = ['@rspack/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rspack.config*.{js,ts,mjs,cjs}'];

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const { cwd } = options;

  const inputs = await findWebpackDependenciesFromConfig({ config: localConfig, cwd });

  return Array.from(inputs).filter(input => !input.specifier.startsWith('builtin:'));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
