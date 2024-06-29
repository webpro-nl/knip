import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency, toUnconfig } from '#p/util/plugin.js';

// https://unocss.dev/guide/config-file
// https://github.com/unocss/unocss/blob/main/packages/config/src/index.ts

const title = 'UnoCSS';

const enablers: EnablerPatterns = ['unocss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [...toUnconfig('uno.config'), ...toUnconfig('unocss.config')];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
