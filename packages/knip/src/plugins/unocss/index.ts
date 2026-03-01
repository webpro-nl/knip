import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toUnconfig } from '../../util/plugin-config.ts';

// https://unocss.dev/guide/config-file
// https://github.com/unocss/unocss/blob/main/packages/config/src/index.ts

const title = 'UnoCSS';

const enablers = ['unocss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [...toUnconfig('uno.config'), ...toUnconfig('unocss.config')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
};

export default plugin;
