import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { compact } from '../../util/array.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import type { WebpackConfig } from '../webpack/types.js';

// https://www.rspack.dev/config

const title = 'Rspack';

const enablers: EnablerPatterns = ['@rspack/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['rspack.config*.{js,ts,mjs,cjs}'];

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const { cwd, isProduction } = options;

  const { entryPatterns, dependencies } = await findWebpackDependenciesFromConfig({ config: localConfig, cwd });

  const deps = Array.from(dependencies).filter(dependency => !dependency.startsWith('builtin:'));

  if (isProduction) return [...entryPatterns];

  return compact([...entryPatterns, ...deps]);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
