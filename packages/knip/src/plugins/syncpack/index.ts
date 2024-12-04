import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';

// https://jamiemason.github.io/syncpack/config/syncpackrc/

const title = 'Syncpack';

const enablers = ['syncpack'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('syncpack')];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
