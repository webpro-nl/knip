import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { CommitizenConfig } from './types.ts';

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

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
