import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { getDependenciesDeep } from './helpers.js';
import type { ESLintConfig } from './types.js';

// Old: https://eslint.org/docs/latest/use/configure/configuration-files
// New: https://eslint.org/docs/latest/use/configure/configuration-files-new

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/extend/shareable-configs#publishing-a-shareable-config

const title = 'ESLint';

const enablers = ['eslint'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest, config }) =>
  hasDependency(dependencies, enablers) ||
  'eslint' in config ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

export const packageJsonPath = 'eslintConfig';

const entry = ['eslint.config.{js,cjs,mjs}'];

const config = ['.eslintrc', '.eslintrc.{js,json,cjs}', '.eslintrc.{yml,yaml}', 'package.json'];

const resolveConfig: ResolveConfig<ESLintConfig> = async (localConfig, options) => {
  const dependencies = await getDependenciesDeep(localConfig, options);
  return Array.from(dependencies);
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  entry,
  config,
  resolveConfig,
} satisfies Plugin;
