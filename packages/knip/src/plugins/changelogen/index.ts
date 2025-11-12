import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { toC12config } from '../../util/plugin-config.js';

// https://github.com/unjs/changelogen

const title = 'Changelogen';

const enablers = ['changelogen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['package.json', ...toC12config('changelog')];

const isRootOnly = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  entry,
};

export default plugin;
