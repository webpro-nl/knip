import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { PackageJson } from '../../types/package-json.ts';
import { toProductionEntry } from "../../util/input.ts";
import { hasDependency } from '../../util/plugin.ts';
import type { RaycastManifest } from './types.ts';

// https://developers.raycast.com/

const title = 'Raycast';

const enablers = ['@raycast/api'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const packageJsonPath = (manifest: PackageJson) => manifest;

const mapEntries = (items: { name?: unknown }[] | undefined, directory: string) => {
  const paths = new Set<string>();

  for (const item of items ?? []) {
    if (typeof item.name === 'string') {
      paths.add(`${directory}${item.name}.{js,jsx,ts,tsx}`);
    }
  }

  return [...paths].map((path) => toProductionEntry(path));
};

const resolveConfig: ResolveConfig<RaycastManifest> = async manifest => {
  return [...mapEntries(manifest.commands, 'src/'), ...mapEntries(manifest.tools, 'src/tools/')];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
  resolveConfig,
};

export default plugin;
