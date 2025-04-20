import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'oxlint';

const enablers = ['oxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.json'];

const entry: string[] = [];

const args = {
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  args,
} satisfies Plugin;
