import { _load } from '../../util/loader.js';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { findNodeArgumentDependencies } from '../../util/node.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/avajs/ava/blob/main/docs/06-configuration.md

export const NAME = 'Ava';

/** @public */
export const ENABLERS = ['ava'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['ava.config.{js,cjs,mjs}', 'package.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PluginConfig = configFilePath.endsWith('package.json') ? manifest.ava : await _load(configFilePath);

  const requires = (config?.require ?? []).map(getPackageNameFromModuleSpecifier);
  const nodeArgs = findNodeArgumentDependencies(config?.nodeArguments ?? []);

  // TODO: Add support for modules specified node environment variables.

  return [...requires, ...nodeArgs];
};

export const findDependencies = timerify(findPluginDependencies);
