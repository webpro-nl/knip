import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://catalyst.rocks

const title = 'Catalyst';

const enablers = ['@github/catalyst'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  nativeVisitors: ['catalyst'],
};

export default plugin;
