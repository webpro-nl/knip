import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { PackageJson } from '../../types/package-json.ts';
import { compact } from '../../util/array.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { RaycastManifest } from './types.ts';

// https://developers.raycast.com/

const title = 'Raycast';

const enablers = ['@raycast/api'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const packageJsonPath = (manifest: PackageJson) => manifest;

const mapEntries = (items: { name?: unknown }[] | undefined, directory: string) => {
  const names = compact((items ?? []).map(item => (typeof item.name === 'string' ? item.name : undefined)));
  return names.map(name => toProductionEntry(`${directory}${name}.{js,jsx,ts,tsx}`));
};

const resolveConfig: ResolveConfig<RaycastManifest> = async manifest => [
  ...mapEntries(manifest.commands, 'src/'),
  ...mapEntries(manifest.tools, 'src/tools/'),
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
  resolveConfig,
};

export default plugin;
