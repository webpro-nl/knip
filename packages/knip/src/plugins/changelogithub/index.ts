import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { toC12config } from '../../util/plugin-config.js';

// https://github.com/antfu/changelogithub

const title = 'Changelogithub';

const enablers = ['changelogithub'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['package.json', ...toC12config('changelogithub')];

const isRootOnly = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  entry,
};

export default plugin;
