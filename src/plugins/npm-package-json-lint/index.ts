import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { NpmPkgJsonLintConfig } from './types.js';

// https://npmpackagejsonlint.org/docs/

export const NAME = 'npm-package-json-lint';

/** @public */
export const ENABLERS = ['npm-package-json-lint'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.npmpackagejsonlintrc.json', 'npmpackagejsonlint.config.js', 'package.json'];

const findNpmPkgJsonLintConfigDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: NpmPkgJsonLintConfig = configFilePath.endsWith('package.json')
    ? manifest.npmpackagejsonlint
    : await _load(configFilePath);
  return config?.extends ? [config.extends] : [];
};

export const findDependencies = timerify(findNpmPkgJsonLintConfigDependencies);
