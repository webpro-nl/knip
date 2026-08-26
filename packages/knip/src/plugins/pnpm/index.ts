import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import type { Input } from '../../util/input.ts';
import { toDependency, toEntry } from '../../util/input.ts';
import type { PnpmConfig } from './types.ts';

// https://pnpm.io/

const title = 'pnpm';

const enablers =
  'This plugin is enabled when a `pnpm-lock.yaml` or `pnpm-workspace.yaml` file is found in the root directory, or when `pnpm@` is specified in the `packageManager` field of `package.json`.';

const isEnabled: IsPluginEnabled = async ({ cwd, manifest }) =>
  manifest.packageManager?.startsWith('pnpm@') || isFile(cwd, 'pnpm-lock.yaml') || isFile(cwd, 'pnpm-workspace.yaml');

const isRootOnly = true;

const entry: string[] = ['.pnpmfile.{cjs,mjs}'];

const config: string[] = ['package.json', 'pnpm-workspace.yaml'];

const resolveConfig: ResolveConfig<PnpmConfig> = config => {
  const inputs: Input[] = entry.map(toEntry);

  const packageExtensions = config?.pnpm?.packageExtensions || config?.packageExtensions;

  if (packageExtensions) {
    for (const extension of Object.values(packageExtensions)) {
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
  entry,
  config,
  resolveConfig,
};

export default plugin;
