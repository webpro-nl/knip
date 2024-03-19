import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { CommitizenConfig } from './types.js';

// https://github.com/commitizen/cz-cli

const title = 'Commitizen';

const enablers = ['commitizen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'config.commitizen';

const config = ['.czrc', '.cz.json', 'package.json'];

const resolveConfig: ResolveConfig<CommitizenConfig> = config => {
  return config.path ? [config.path] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} as const;
