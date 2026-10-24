import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://lingui.dev/ref/conf

const title = 'Lingui';

const enablers = ['@lingui/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['lingui.config.{js,cjs,ts,mjs}', 'package.json', '.linguirc', '.linguirc.{json,ts,js}'];

const args = {
  config: ['config'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
};

export default plugin;
