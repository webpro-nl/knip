import { toEntryPattern } from 'src/util/protocols.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { UnbuildConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/unjs/unbuild#unbuild

export const NAME = 'unbuild';

/** @public */
export const ENABLERS = ['unbuild'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['build.config.{js,cjs,mjs,ts,mts,cts,json}'];

const findUnbuildDependencies: GenericPluginCallback = async configFilePath => {
  const localConfig: UnbuildConfig | undefined = await load(configFilePath);
  if (!localConfig) return [];

  const entries = [];
  if (Array.isArray(localConfig)) {
    for (const obj of localConfig) {
      entries.push(...(obj.entries || []));
    }
  } else {
    entries.push(...(localConfig.entries || []));
  }

  const entryPatterns = entries.map(entry => toEntryPattern(typeof entry === 'string' ? entry : entry.input));

  return [...entryPatterns];
};

export const findDependencies = timerify(findUnbuildDependencies);
