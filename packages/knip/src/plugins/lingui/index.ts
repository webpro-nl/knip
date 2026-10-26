import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://lingui.dev/ref/conf
// https://github.com/lingui/js-lingui/blob/v6.10.1/packages/conf/src/getConfig.ts

const title = 'Lingui';

const enablers = ['@lingui/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['lingui.config.{js,cjs,ts,mjs}', '.linguirc.{js,ts}'];

const args = {
  config: ['config'],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
