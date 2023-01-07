import { getBinariesFromScripts } from '../../manifest/helpers.js';
import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { LintStagedConfig } from './types.js';

// https://github.com/okonet/lint-staged

export const NAME = 'lint-staged';

/** @public */
export const ENABLERS = ['lint-staged'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.lintstagedrc',
  '.lintstagedrc.json',
  '.lintstagedrc.{yml,yaml}',
  '.lintstagedrc.{js,mjs,cjs}',
  'lint-staged.config.{js,mjs,cjs}',
  'package.json',
];

const findLintStagedDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  let config: LintStagedConfig = configFilePath.endsWith('package.json')
    ? manifest['lint-staged']
    : await _load(configFilePath);

  if (!config) return [];

  if (typeof config === 'function') {
    config = config();
  }

  const binaries: Set<string> = new Set();

  for (const entry of Object.values(config).flat()) {
    const scripts = [typeof entry === 'function' ? await entry([]) : entry].flat();
    getBinariesFromScripts(scripts).forEach(binary => binaries.add(binary));
  }

  // Warning: binaries do not always have the same name as their package
  return Array.from(binaries);
};

export const findDependencies = timerify(findLintStagedDependencies);
