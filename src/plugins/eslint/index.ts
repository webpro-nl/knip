import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import { fallback } from './fallback.js';
import { getDependenciesDeep } from './helpers.js';
import type { ESLintConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'ESLint';

/** @public */
export const ENABLERS = ['eslint'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

// Current: https://eslint.org/docs/latest/user-guide/configuring/configuration-files
export const CONFIG_FILE_PATTERNS = ['.eslintrc', '.eslintrc.{js,json,cjs}', '.eslintrc.{yml,yaml}', 'package.json'];

// New: https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new
// We can handle eslint.config.js just like other source code (as dependencies are imported)
export const ENTRY_FILE_PATTERNS = ['eslint.config.js'];

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/developer-guide/shareable-configs#publishing-a-shareable-config

const findESLintDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  let config: ESLintConfig | undefined = undefined;

  try {
    config = configFilePath.endsWith('package.json') ? manifest.eslintConfig : await _load(configFilePath);
  } catch (error) {
    if (error instanceof Error && error.cause instanceof Error && /Failed to patch ESLint/.test(error.cause.message)) {
      // Crazy fallback mechanism kicks in when something like @rushstack/eslint-patch/modern-module-resolution
      return fallback(configFilePath, { cwd });
    } else {
      throw error;
    }
  }

  if (!config) return [];

  const dependencies = await getDependenciesDeep(configFilePath); // TODO Loading configFilePath twice

  return Array.from(dependencies);
};

export const findDependencies = timerify(findESLintDependencies);
