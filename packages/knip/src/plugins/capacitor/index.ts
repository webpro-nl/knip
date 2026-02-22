import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { CapacitorConfig } from './types.ts';

// https://capacitorjs.com/docs/config

const title = 'Capacitor';

const enablers = [/^@capacitor\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['capacitor.config.{json,ts}'];

const resolveConfig: ResolveConfig<CapacitorConfig> = async (config, { configFileDir }) => {
  const plugins = config.includePlugins ?? [];
  const android = isFile(configFileDir, 'android/capacitor.settings.gradle') ? ['@capacitor/android'] : [];
  const ios = isFile(configFileDir, 'ios/App/Podfile') ? ['@capacitor/ios'] : [];

  return [...plugins, ...android, ...ios].map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
