import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://fast.design

const title = 'FAST';

const enablers = ['@microsoft/fast-element'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  nativeVisitors: ['fast'],
};

export default plugin;
