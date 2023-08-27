import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesDeep } from './helpers.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'ESLint';

/** @public */
export const ENABLERS = ['eslint'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies, manifest, config }) =>
  hasDependency(dependencies, ENABLERS) ||
  'eslint' in config ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

// Current: https://eslint.org/docs/latest/user-guide/configuring/configuration-files
export const CONFIG_FILE_PATTERNS = ['.eslintrc', '.eslintrc.{js,json,cjs}', '.eslintrc.{yml,yaml}', 'package.json'];

// New: https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new
// We can handle eslint.config.js just like other source code (as dependencies are imported)
export const ENTRY_FILE_PATTERNS = ['eslint.config.js'];

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/developer-guide/shareable-configs#publishing-a-shareable-config

const findESLintDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  const dependencies = await getDependenciesDeep(configFilePath, new Set(), { cwd, manifest });
  return Array.from(dependencies);
};

export const findDependencies = timerify(findESLintDependencies);
