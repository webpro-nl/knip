import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://commitlint.js.org

type CommitLintConfig = {
  extends: string[];
};

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('@commitlint/cli');

export const CONFIG_FILE_PATTERNS = ['commitlint.config.{js,ts}'];

const findCommitLintDependencies: GenericPluginCallback = async configFilePath => {
  const config: CommitLintConfig = await _load(configFilePath);
  return config.extends;
};

export const findDependencies = timerify(findCommitLintDependencies);
