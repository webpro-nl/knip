import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
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

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('prettier');

export const CONFIG_FILE_PATTERNS = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,yml,yaml}',
  'prettier.config.{js,cjs}',
  'package.json',
];

export const ENTRY_FILE_PATTERNS = ['.prettierrc.{js,cjs}', 'prettier.config.{js,cjs}'];

const findPrettierDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PrettierConfig = configFilePath.endsWith('package.json')
    ? manifest.prettier
    : await _load(configFilePath);

  return config && Array.isArray(config.plugins)
    ? config.plugins.filter((plugin): plugin is string => typeof plugin === 'string').map(getPackageName)
    : [];
};

export const findDependencies = timerify(findPrettierDependencies);
