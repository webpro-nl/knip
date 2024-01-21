import type { EnsuredPluginConfiguration, WorkspaceConfiguration } from './config.js';
import type { PackageJson } from './package-json.js';
import type { DependencySet } from './workspace.js';

export interface BaseOptions {
  cwd: string;
  manifestScriptNames: Set<string>;
  dependencies: DependencySet;
}

type IsPluginEnabledCallbackOptions = {
  cwd: string;
  manifest: PackageJson;
  dependencies: Set<string>;
  config: WorkspaceConfiguration;
};

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean | Promise<boolean>;

export interface GenericPluginCallbackOptions extends BaseOptions {
  manifest: PackageJson;
  config: EnsuredPluginConfiguration;
  isProduction: boolean;
  enabledPlugins: string[];
}

export type GenericPluginCallback = (
  configFilePath: string,
  options: GenericPluginCallbackOptions
) => Promise<string[]> | string[];

/** @internal */
export interface Plugin {
  NAME: string;
  ENABLERS: string[];
  PACKAGE_JSON_PATH?: string;
  isEnabled: IsPluginEnabledCallback;
  CONFIG_FILE_PATTERNS?: string[];
  ENTRY_FILE_PATTERNS?: string[];
  PRODUCTION_ENTRY_FILE_PATTERNS?: string[];
  PROJECT_FILE_PATTERNS?: string[];
  findDependencies: GenericPluginCallback;
}
