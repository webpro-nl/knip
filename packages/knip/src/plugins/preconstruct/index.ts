import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PreconstructConfig } from './types.js';

// https://preconstruct.tools/configuration

const title = 'Preconstruct';

const enablers = ['@preconstruct/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveConfig: ResolveConfig<PreconstructConfig> = async config => {
  return (config.entrypoints ?? []).map(id => toProductionEntry(id, { allowIncludeExports: true }));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
