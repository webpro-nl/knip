import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://google.github.io/zx/

const title = 'zx';

const enablers = ['zx'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  nativeVisitors: ['zx'],
};

export default plugin;
