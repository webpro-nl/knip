import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { args as typescriptArgs, config, resolveConfig } from '../typescript/index.ts';

// https://github.com/oxc-project/tsrs/blob/main/docs/USAGE.md

const title = 'tsrs';

const enablers = ['tsrs'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const args = { ...typescriptArgs, binaries: ['tsrs'] };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
