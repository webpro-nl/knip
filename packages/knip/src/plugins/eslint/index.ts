import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesDeep } from './helpers.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// Old: https://eslint.org/docs/latest/use/configure/configuration-files
// New: https://eslint.org/docs/latest/use/configure/configuration-files-new

// Note: shareable configs should use `peerDependencies` for plugins
// https://eslint.org/docs/latest/extend/shareable-configs#publishing-a-shareable-config

const NAME = 'ESLint';

const ENABLERS = ['eslint'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies, manifest, config }) =>
  hasDependency(dependencies, ENABLERS) ||
  'eslint' in config ||
  Boolean(manifest.name && /(^eslint-config|\/eslint-config)/.test(manifest.name));

export const PACKAGE_JSON_PATH = 'eslintConfig';

const CONFIG_FILE_PATTERNS = [
  'eslint.config.{js,cjs,mjs}',
  '.eslintrc',
  '.eslintrc.{js,json,cjs}',
  '.eslintrc.{yml,yaml}',
  'package.json',
];

const findESLintDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, isProduction }) => {
  if (isProduction) return [];

  // The new configuration format does not need custom dependency resolving (it has only imports)
  const baseFilePath = basename(configFilePath);
  if (
    baseFilePath === 'eslint.config.js' ||
    baseFilePath === 'eslint.config.cjs' ||
    baseFilePath === 'eslint.config.mjs'
  )
    return [];

  const dependencies = await getDependenciesDeep(configFilePath, { cwd, manifest });
  return Array.from(dependencies);
};

const findDependencies = timerify(findESLintDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
