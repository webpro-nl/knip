import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { toUnconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/antfu/node-modules-inspector

const title = 'node-modules-inspector';

const enablers = ['node-modules-inspector'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [...toUnconfig('node-modules-inspector.config')];

const args = {
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  args,
} satisfies Plugin;
