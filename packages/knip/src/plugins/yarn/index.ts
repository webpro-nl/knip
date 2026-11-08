import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import type { Input } from '../../util/input.ts';
import { toDeferResolveEntry, toDependency, toEntry } from '../../util/input.ts';
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

const resolveConfig: ResolveConfig<YarnConfig> = (config, { cwd }) => {
  const inputs: Input[] = entry.map(toEntry);

  if (Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (typeof plugin === 'string') inputs.push(toDeferResolveEntry(plugin, { dir: cwd }));
      else if (typeof plugin.path === 'string') inputs.push(toDeferResolveEntry(plugin.path, { dir: cwd }));
    }
  }

  if (config.yarnPath) {
    inputs.push(toDeferResolveEntry(config.yarnPath, { dir: cwd }));
  }

  if (config.packageExtensions) {
    for (const extension of Object.values(config.packageExtensions)) {
      if (extension.peerDependencies) {
        for (const dep of Object.keys(extension.peerDependencies)) inputs.push(toDependency(dep, { optional: true }));
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
