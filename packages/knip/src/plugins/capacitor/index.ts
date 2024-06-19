import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { isFile } from '#p/util/fs.js';
import { join } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import type { CapacitorConfig } from './types.js';

// https://capacitorjs.com/docs/config

const title = 'Capacitor';

const enablers = [/^@capacitor\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['capacitor.config.{json,ts}'];

const resolveConfig: ResolveConfig<CapacitorConfig> = async (config, { configFileDir }) => {
  const exists = (filePath: string) => isFile(join(configFileDir, filePath));

  const plugins = config.includePlugins ?? [];
  const android = (await exists('android/capacitor.settings.gradle')) ? ['@capacitor/android'] : [];
  const ios = (await exists('ios/App/Podfile')) ? ['@capacitor/ios'] : [];

  return [...plugins, ...android, ...ios];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
