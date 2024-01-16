import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { MochaConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://mochajs.org/#configuring-mocha-nodejs

const NAME = 'Mocha';

const ENABLERS = ['mocha'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

const ENTRY_FILE_PATTERNS = ['**/test/*.{js,cjs,mjs}'];

const findMochaDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config, manifest, isProduction } = options;

  const localConfig: MochaConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.mocha : await load(configFilePath);

  const entryPatterns = (config.entry ?? (localConfig?.spec ? [localConfig.spec].flat() : ENTRY_FILE_PATTERNS)).map(
    toEntryPattern
  );

  if (isProduction || !localConfig) return entryPatterns;

  const require = localConfig.require ? [localConfig.require].flat() : [];

  return [...require, ...entryPatterns];
};

const findDependencies = timerify(findMochaDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};
