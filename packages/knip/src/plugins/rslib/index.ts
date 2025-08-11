import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import type { RslibConfig } from './types.js';

// https://rslib.rs/guide/basic/configure-rslib

const title = 'Rslib';

const enablers = ['rslib'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['rslib*.config.{mjs,ts,js,cjs,mts,cts}'];

const resolveConfig: ResolveConfig<RslibConfig> = () => {
  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  resolveConfig,
} satisfies Plugin;
