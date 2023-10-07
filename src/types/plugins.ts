import type { EnsuredPluginConfiguration, WorkspaceConfiguration } from './config.js';
import type { PackageJson } from '@npmcli/package-json';

export type PackageJsonWithPlugins = PackageJson & Record<string, unknown>;

type IsPluginEnabledCallbackOptions = {
  cwd: string;
  manifest: PackageJson;
  dependencies: Set<string>;
  config: WorkspaceConfiguration;
};

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean | Promise<boolean>;

export type GenericPluginCallbackOptions = {
  cwd: string;
  manifest: PackageJsonWithPlugins;
  config?: EnsuredPluginConfiguration;
  isProduction: boolean;
};

export type GenericPluginCallback = (
  configFilePath: string,
  options: GenericPluginCallbackOptions
) => Promise<string[]> | string[];
