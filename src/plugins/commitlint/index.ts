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

export const CONFIG_FILE_PATTERNS = ['commitlint.config.{js,ts}'];

const findCommitLintDependencies: GenericPluginCallback = async configFilePath => {
  const config: CommitLintConfig = await _load(configFilePath);
  return config?.extends ? [config.extends].flat() : [];
};

export const findDependencies = timerify(findCommitLintDependencies);
