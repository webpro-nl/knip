import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { toC12config } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/antfu/changelogithub

const title = 'Changelogithub';

const enablers = ['changelogithub'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['package.json', ...toC12config('changelogithub')];

const isRootOnly = true;

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  entry,
} satisfies Plugin;
