import path from 'node:path';
import { _load } from '../../util/loader.js';
import { isAbsolute } from '../../util/path.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typedoc.org/guides/overview/

export const NAME = 'TypeDoc';

/** @public */
export const ENABLERS = ['typedoc'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'typedoc.{js,cjs,json,jsonc}',
  'typedoc.config.{js,cjs}',
  '.config/typedoc.{js,cjs,json,jsonc}',
  '.config/typedoc.config.{js,cjs}',
];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { cwd }) => {
  const config: PluginConfig = await _load(configFilePath);

  const entryFiles: string[] = [];
  const dependencies: string[] = [];

  (config?.plugin ?? []).forEach(plugin => {
    if (isAbsolute(plugin)) {
      entryFiles.push(plugin);
    } else if (plugin.startsWith('.')) {
      entryFiles.push(path.join(cwd, plugin));
    } else {
      dependencies.push(plugin);
    }
  });

  return { dependencies, entryFiles };
};

export const findDependencies = timerify(findPluginDependencies);
