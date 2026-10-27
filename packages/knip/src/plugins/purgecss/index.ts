import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://purgecss.com/configuration
// https://github.com/FullHuman/purgecss/blob/v8.0.0/packages/purgecss/src/constants.ts
// https://github.com/FullHuman/purgecss/blob/v8.0.0/packages/postcss-purgecss/src/index.ts

const title = 'PurgeCSS';

const enablers = ['purgecss', '@fullhuman/postcss-purgecss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['purgecss.config.js'];

const args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
