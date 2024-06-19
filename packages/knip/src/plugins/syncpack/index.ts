import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';

// link to syncpack docs https://jamiemason.github.io/syncpack/config/syncpackrc/

const title = 'Syncpack';

const enablers: EnablerPatterns = ['syncpack'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.syncpackrc', '.syncpackrc.{json,yaml,yml,js,cjs}', '.syncpack.config.{js,cjs}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
