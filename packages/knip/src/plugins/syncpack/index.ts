import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';

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
