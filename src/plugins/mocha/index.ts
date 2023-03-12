import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://mochajs.org/#configuring-mocha-nodejs

export const NAME = 'Mocha';

/** @public */
export const ENABLERS = ['mocha'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

// Note that `TEST_FILE_PATTERNS` in src/constants.ts are already included by default, no additions necessary
export const ENTRY_FILE_PATTERNS = [];

const findMochaDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config = configFilePath.endsWith('package.json') ? manifest.mocha : await _load(configFilePath);
  if (config) {
    const require = config.require;
    return require ? [require].flat() : [];
  }
  return [];
};

export const findDependencies = timerify(findMochaDependencies);
