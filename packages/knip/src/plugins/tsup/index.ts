import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { TsupConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://paka.dev/npm/tsup/api

export const NAME = 'tsup';

/** @public */
export const ENABLERS = ['tsup'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['tsup.config.js'];

const findTsupDependencies: GenericPluginCallback = async configFilePath => {
  let localConfig: TsupConfig | undefined = await load(configFilePath);
  if (typeof localConfig === 'function') localConfig = await localConfig({});

  if (!localConfig) return [];

  const entryPatterns = [localConfig].flat().flatMap(config => {
    if (!config.entry) return [];
    if (Array.isArray(config.entry)) return config.entry.map(toEntryPattern);
    return Object.values(config.entry).map(toEntryPattern);
  });

  return entryPatterns;
};

export const findDependencies = timerify(findTsupDependencies);
