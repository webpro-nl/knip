import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://commitlint.js.org

type CommitLintConfig = {
  extends: string[];
};

export const NAME = 'commitlint';

/** @public */
export const ENABLERS = ['@commitlint/cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

// https://github.com/conventional-changelog/commitlint#config
export const CONFIG_FILE_PATTERNS = [
  '.commitlintrc',
  '.commitlintrc.{json,yaml,yml,js,cjs,ts,cts}',
  'commitlint.config.{js,cjs,ts,cts}',
  'package.json',
];

const findCommitLintDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: CommitLintConfig = configFilePath.endsWith('package.json')
    ? manifest.commitlint
    : await _load(configFilePath);
  return config?.extends ? [config.extends].flat() : [];
};

export const findDependencies = timerify(findCommitLintDependencies);
