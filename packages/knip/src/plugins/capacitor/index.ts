import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile, loadJSON } from '../../util/fs.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { resolvePackageManifestPath } from '../../util/resolve.ts';
import type { CapacitorConfig, CapacitorPlatform, CapacitorPluginPackage } from './types.ts';

// https://capacitorjs.com/docs/config
// https://github.com/ionic-team/capacitor/blob/8.5.1/cli/src/plugin.ts

const title = 'Capacitor';

const enablers = [/^@capacitor\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['capacitor.config.{json,js,ts}'];

const resolveConfig: ResolveConfig<CapacitorConfig> = async (config, { configFileDir, cwd, manifest }) => {
  const platforms: CapacitorPlatform[] = [];
  if (isFile(configFileDir, 'android/capacitor.settings.gradle')) platforms.push('android');
  const hasIOS = isFile(configFileDir, 'ios/App/Podfile') || isFile(configFileDir, 'ios/App/CapApp-SPM/Package.swift');
  if (hasIOS) platforms.push('ios');

  const plugins = new Set<string>(platforms.length ? [] : config.includePlugins);
  const automatic: CapacitorPlatform[] = [];
  for (const platform of platforms) {
    const included = config[platform]?.includePlugins ?? config.includePlugins;
    if (included) {
      for (const name of included) plugins.add(name);
    } else {
      automatic.push(platform);
    }
  }

  if (automatic.length) {
    for (const dependencies of [manifest.dependencies, manifest.devDependencies]) {
      for (const name in dependencies) {
        const path = resolvePackageManifestPath(name, cwd);
        if (!path) continue;
        const pkg: CapacitorPluginPackage = await loadJSON(path);
        if (automatic.some(platform => pkg.capacitor?.[platform])) plugins.add(name);
      }
    }
  }

  return [...plugins, ...platforms.map(platform => `@capacitor/${platform}`)].map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
