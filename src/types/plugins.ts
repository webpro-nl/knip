import type { PluginConfiguration } from './config.js';
import type { PackageJson } from 'type-fest';

type IsPluginEnabledCallbackOptions = { cwd: string; manifest: PackageJson; dependencies: Set<string> };

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean | Promise<boolean>;

type GenericPluginCallbackOptions = {
  cwd: string;
  manifest: PackageJson;
  config: PluginConfiguration;
  isProduction: boolean;
};

export type GenericPluginCallback = (
  configFilePath: string,
  options: GenericPluginCallbackOptions
) => Promise<string[]> | string[];
