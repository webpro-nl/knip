import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { get } from '#p/util/object.js';
import { hasDependency, toCosmiconfig } from '#p/util/plugin.js';

// link to syncpack docs https://jamiemason.github.io/syncpack/config/syncpackrc/

const title = 'Syncpack';

const enablers: EnablerPatterns = ['syncpack'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('syncpack')];
const packageJsonPath: Plugin['packageJsonPath'] = manifest => get(manifest, 'syncpack');

export default {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
} satisfies Plugin;
