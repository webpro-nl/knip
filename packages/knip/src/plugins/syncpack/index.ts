import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';

// https://jamiemason.github.io/syncpack/config/syncpackrc/

const title = 'Syncpack';

const enablers = ['syncpack'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('syncpack')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
};

export default plugin;
