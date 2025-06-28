import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { toUnconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';

// https://unocss.dev/guide/config-file
// https://github.com/unocss/unocss/blob/main/packages/config/src/index.ts

const title = 'UnoCSS';

const enablers = ['unocss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [...toUnconfig('uno.config'), ...toUnconfig('unocss.config')];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
