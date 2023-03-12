import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://prettier.io/docs/en/configuration.html

type PrettierConfig = {
  plugins?: (
    | string
    | {
        parsers?: Record<string, unknown>;
        printers?: Record<string, unknown>;
        languages?: unknown[];
        options?: Record<string, unknown>;
      }
  )[];
};

export const NAME = 'Prettier';

/** @public */
export const ENABLERS = ['prettier'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,yml,yaml}',
  'prettier.config.{js,cjs}',
  'package.json',
];

const findPrettierDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PrettierConfig = configFilePath.endsWith('package.json')
    ? manifest.prettier
    : await _load(configFilePath);

  return config && Array.isArray(config.plugins)
    ? config.plugins.filter((plugin): plugin is string => typeof plugin === 'string')
    : [];
};

export const findDependencies = timerify(findPrettierDependencies);
