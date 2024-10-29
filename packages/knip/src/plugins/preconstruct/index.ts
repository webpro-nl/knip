import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PreconstructConfig } from './types.js';

// https://preconstruct.tools/configuration

const title = 'Preconstruct';

const enablers = ['@preconstruct/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveEntryPaths: ResolveConfig<PreconstructConfig> = async config => {
  return (config.entrypoints ?? []).map(toEntry);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
} satisfies Plugin;
