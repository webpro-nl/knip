import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { CommitizenConfig } from './types.js';

// https://github.com/commitizen/cz-cli

const title = 'Commitizen';

const enablers = ['commitizen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const packageJsonPath = 'config.commitizen';

const config = ['.czrc', '.cz.json', 'package.json'];

const resolveConfig: ResolveConfig<CommitizenConfig> = config => {
  return config.path ? [toDependency(config.path)] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
