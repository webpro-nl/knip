import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://oxc.rs/docs/guide/usage/formatter/config.html

const title = 'Oxfmt';

const enablers = ['oxfmt'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.oxfmtrc.json', '.oxfmtrc.jsonc', 'oxfmt.config.ts'];

const args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
};

export default plugin;
