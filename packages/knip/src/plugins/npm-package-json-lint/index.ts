import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { NpmPkgJsonLintConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://npmpackagejsonlint.org/docs/

const NAME = 'npm-package-json-lint';

const ENABLERS = ['npm-package-json-lint'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'npmpackagejsonlint';

const CONFIG_FILE_PATTERNS = ['.npmpackagejsonlintrc.json', 'npmpackagejsonlint.config.js', 'package.json'];

const findNpmPkgJsonLintConfigDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: NpmPkgJsonLintConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest[PACKAGE_JSON_PATH] : await load(configFilePath);

  return localConfig?.extends ? [localConfig.extends] : [];
};

const findDependencies = timerify(findNpmPkgJsonLintConfigDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
