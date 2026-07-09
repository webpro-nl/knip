import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import type { Input } from '../../util/input.ts';
import { toDependency, toEntry } from '../../util/input.ts';
import type { YarnConfig } from './types.ts';

// https://yarnpkg.com

const title = 'Yarn';

const enablers =
  'This plugin is enabled when a `yarn.lock` file is found in the root directory, or when `yarn@` is specified in the `packageManager` field of `package.json`.';

const isEnabled: IsPluginEnabled = async ({ cwd, manifest }) =>
  manifest.packageManager?.startsWith('yarn@') || isFile(cwd, 'yarn.lock');

const isRootOnly = true;

const config = ['.yarnrc.yml'];

const entry = ['yarn.config.cjs'];

const resolveConfig: ResolveConfig<YarnConfig> = config => {
  const inputs: Input[] = entry.map(toEntry);

  if (Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (typeof plugin === 'string') inputs.push(toEntry(plugin));
      else if (typeof plugin.path === 'string') inputs.push(toEntry(plugin.path));
    }
  }

  if (config.yarnPath) {
    inputs.push(toEntry(config.yarnPath));
  }

  if (config.packageExtensions) {
    for (const extension of Object.values(config.packageExtensions)) {
      if (extension.peerDependencies) {
        for (const dep of Object.keys(extension.peerDependencies)) {
          const optional = extension.peerDependenciesMeta?.[dep]?.optional === true;
          inputs.push(optional ? toDependency(dep, { optional: true }) : toDependency(dep));
        }
      }
    }
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  entry,
  resolveConfig,
};

export default plugin;
