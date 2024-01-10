import { basename } from '../../util/path.js';
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

export const CONFIG_FILE_PATTERNS = ['tsup.config.{js,ts,cjs,json}', 'package.json'];

const findTsupDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest } = options;

  let localConfig: TsupConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.tsup : await load(configFilePath);

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
