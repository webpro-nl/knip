import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { UnbuildConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/unjs/unbuild#unbuild

const NAME = 'unbuild';

const ENABLERS = ['unbuild'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['build.config.{js,cjs,mjs,ts,mts,cts,json}'];

const findUnbuildDependencies: GenericPluginCallback = async configFilePath => {
  const localConfig: UnbuildConfig | undefined = await load(configFilePath);
  if (!localConfig) return [];

  return [localConfig]
    .flat()
    .map(obj => obj.entries)
    .flatMap(entries => entries?.map(entry => (typeof entry === 'string' ? entry : entry.input)) ?? [])
    .map(toEntryPattern);
};

const findDependencies = timerify(findUnbuildDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
