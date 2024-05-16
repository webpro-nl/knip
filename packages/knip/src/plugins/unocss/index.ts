import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';

// https://unocss.dev/guide/config-file

const title = 'UnoCSS';

const enablers: EnablerPatterns = ['unocss', /^@unocss\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['uno.config.{js,ts,mjs,mts}', 'unocss.config.{js,ts,mjs,mts}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
