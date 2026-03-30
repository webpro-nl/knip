import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { getPackageNameFromFilePath } from '../../util/modules.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { ChangesetsConfig } from './types.ts';

// https://github.com/changesets/changesets/blob/main/docs/config-file-options.md

const title = 'Changesets';

const enablers = ['@changesets/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const config = ['.changeset/config.json'];

const resolveConfig: ResolveConfig<ChangesetsConfig> = config => {
  const inputs = (
    Array.isArray(config.changelog)
      ? [config.changelog[0]]
      : typeof config.changelog === 'string'
        ? [config.changelog]
        : []
  ).map(id => toDependency(id));

  if (config.$schema?.includes('node_modules/')) {
    const packageName = getPackageNameFromFilePath(config.$schema);
    if (packageName) inputs.push(toDependency(packageName));
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  resolveConfig,
};

export default plugin;
