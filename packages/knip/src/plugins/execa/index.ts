import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/sindresorhus/execa

const title = 'execa';

const enablers = ['execa'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  nativeVisitors: ['execa'],
};

export default plugin;
