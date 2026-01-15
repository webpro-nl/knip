import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { toUnconfig } from '../../util/plugin-config.js';

// https://github.com/antfu/node-modules-inspector

const title = 'node-modules-inspector';

const enablers = ['node-modules-inspector'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [...toUnconfig('node-modules-inspector.config')];

const args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
};

export default plugin;
