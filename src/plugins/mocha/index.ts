import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://mochajs.org/#configuring-mocha-nodejs

export const NAME = 'Mocha';

/** @public */
export const ENABLERS = ['mocha'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/test/*.{js,cjs,mjs}'];

const findMochaDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  const entryPatterns = ENTRY_FILE_PATTERNS.map(toEntryPattern);
  if (isProduction) return entryPatterns;

  const config = configFilePath.endsWith('package.json') ? manifest.mocha : await load(configFilePath);

  if (!config) return [];

  const require = config.require ? [config.require].flat() : [];

  return [...require, ...entryPatterns];
};

export const findDependencies = timerify(findMochaDependencies);
