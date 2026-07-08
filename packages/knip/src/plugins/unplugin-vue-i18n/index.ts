import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toIgnore } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n

const title = '@intlify/unplugin-vue-i18n';

const enablers = ['@intlify/unplugin-vue-i18n'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolve: Resolve = () => [toIgnore('@intlify/unplugin-vue-i18n/messages', 'unlisted')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolve,
};

export default plugin;
