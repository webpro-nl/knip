import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'Oxlint';

const enablers = ['oxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.json'];

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
