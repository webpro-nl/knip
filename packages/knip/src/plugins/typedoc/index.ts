import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { TypeDocConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typedoc.org/guides/overview/

const NAME = 'TypeDoc';

const ENABLERS = ['typedoc'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'typedocOptions';

const CONFIG_FILE_PATTERNS = [
  'typedoc.{js,cjs,json,jsonc}',
  'typedoc.config.{js,cjs}',
  '.config/typedoc.{js,cjs,json,jsonc}',
  '.config/typedoc.config.{js,cjs}',
  'package.json',
  'tsconfig.json',
];

const findTypeDocDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: TypeDocConfig | undefined =
    basename(configFilePath) === 'package.json'
      ? manifest[PACKAGE_JSON_PATH]
      : basename(configFilePath) === 'tsconfig.json'
        ? (await load(configFilePath)).typedocOptions
        : await load(configFilePath);

  return localConfig?.plugin ?? [];
};

const findDependencies = timerify(findTypeDocDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
