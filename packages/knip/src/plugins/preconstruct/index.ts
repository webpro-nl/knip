import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { PreconstructConfig } from './types.js';

// https://preconstruct.tools/configuration

const title = 'Preconstruct';

const enablers = ['@preconstruct/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveEntryPaths: ResolveConfig<PreconstructConfig> = async config => {
  return (config.entrypoints ?? []).map(toEntryPattern);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
} satisfies Plugin;
