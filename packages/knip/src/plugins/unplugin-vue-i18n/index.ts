import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n

const title = '@intlify/unplugin-vue-i18n';

const enablers = ['@intlify/unplugin-vue-i18n'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
};

export default plugin;
