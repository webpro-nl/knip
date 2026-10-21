import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/sindresorhus/nano-spawn

const title = 'nano-spawn';

const enablers = ['nano-spawn'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  nativeVisitors: ['nano-spawn'],
};

export default plugin;
