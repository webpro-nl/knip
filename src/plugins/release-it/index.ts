import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { ReleaseItConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/release-it/release-it/blob/master/docs/plugins.md#using-a-plugin

export const NAME = 'Release It';

/** @public */
export const ENABLERS = ['release-it'];

export const PACKAGE_JSON_PATH = 'release-it';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.release-it.json',
  '.release-it.{js,cjs}',
  '.release-it.{yml,yaml}',
  'package.json',
];

const findReleaseItDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, isProduction }) => {
  if (isProduction) return [];

  const config: ReleaseItConfig = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);

  if (!config) return [];

  const plugins = config.plugins ? Object.keys(config.plugins) : [];
  const scripts = config.hooks ? Object.values(config.hooks).flat() : [];
  if (typeof config.github?.releaseNotes === 'string') {
    scripts.push(config.github.releaseNotes);
  }
  if (typeof config.gitlab?.releaseNotes === 'string') {
    scripts.push(config.gitlab.releaseNotes);
  }
  const dependencies = _getDependenciesFromScripts(scripts, { cwd, manifest });

  return [...plugins, ...dependencies];
};

export const findDependencies = timerify(findReleaseItDependencies);
