import { Configuration, PluginConfiguration, WorkspaceConfiguration } from './config.js';
import type { PackageJson } from 'type-fest';

type IsPluginEnabledCallbackOptions = { cwd: string; manifest: PackageJson; dependencies: Set<string> };

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean | Promise<boolean>;

type GenericPluginCallbackOptions = {
  cwd: string;
  manifest: PackageJson;
  config: PluginConfiguration;
  workspaceConfig: WorkspaceConfiguration;
  rootConfig: Configuration;
  isProduction: boolean;
};

export type GenericPluginCallback = (
  configFilePath: string,
  { cwd, manifest, config, workspaceConfig, isProduction }: GenericPluginCallbackOptions
) => Promise<string[]> | string[];
