import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { toDependency } from '../../util/protocols.js';
import type { CommitizenConfig } from './types.js';

// https://github.com/commitizen/cz-cli

const title = 'Commitizen';

const enablers = ['commitizen'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'config.commitizen';

const config = ['.czrc', '.cz.json', 'package.json'];

const resolveConfig: ResolveConfig<CommitizenConfig> = config => {
  return config.path ? [toDependency(config.path)] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
