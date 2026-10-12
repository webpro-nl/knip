import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/eslint/config-inspector

const title = 'ESLint Config Inspector';

const enablers = ['@eslint/config-inspector'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const args = {
  binaries: ['config-inspector', 'eslint-config-inspector'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  args,
};

export default plugin;
