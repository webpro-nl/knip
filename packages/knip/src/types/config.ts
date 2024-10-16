import type { z } from 'zod';
import type { ConfigurationValidator, pluginSchema } from '../ConfigurationValidator.js';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { Dependency } from '../util/protocols.js';
import type { PluginName } from './PluginNames.js';
import type { Args } from './args.js';
import type { Tags } from './cli.js';
import type { IssueType, Rules } from './issues.js';
import type { PackageJson } from './package-json.js';
import type { DependencySet } from './workspace.js';

export interface GetDependenciesFromScriptsOptions extends BaseOptions {
  knownGlobalsOnly?: boolean;
}

export type GetDependenciesFromScripts = (
  npmScripts: string | string[] | Set<string>,
  options: GetDependenciesFromScriptsOptions
) => Dependency[];

export type GetDependenciesFromScriptsP = (
  npmScripts: string | string[] | Set<string>,
  options?: Partial<GetDependenciesFromScriptsOptions>
) => Dependency[];

type FromArgs = (args: string[]) => Dependency[];

interface BinaryResolverOptions extends GetDependenciesFromScriptsOptions {
  fromArgs: FromArgs;
}

export type Resolver = (binary: string, args: string[], options: BinaryResolverOptions) => Dependency[];

export type RawConfiguration = z.infer<typeof ConfigurationValidator>;

export type RawPluginConfiguration = z.infer<typeof pluginSchema>;

export type IgnorePatterns = (string | RegExp)[];

type IgnorableExport = 'class' | 'enum' | 'function' | 'interface' | 'member' | 'type';

export type IgnoreExportsUsedInFile = boolean | Partial<Record<IgnorableExport, boolean>>;

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  skipExports: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  isReportClassMembers: boolean;
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile;
  tags: Tags;
};

export interface Configuration {
  rules: Rules;
  include: IssueType[];
  exclude: IssueType[];
  ignore: NormalizedGlob;
  ignoreBinaries: IgnorePatterns;
  ignoreDependencies: IgnorePatterns;
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile;
  ignoreMembers: IgnorePatterns;
  ignoreWorkspaces: string[];
  isIncludeEntryExports: boolean;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;
  rootPluginConfigs: Partial<PluginsConfiguration>;
}

export type NormalizedGlob = string[];

export type EnsuredPluginConfiguration = {
  config: NormalizedGlob | null;
  entry: NormalizedGlob | null;
  project: NormalizedGlob | null;
};

interface BaseWorkspaceConfiguration {
  entry: NormalizedGlob;
  project: NormalizedGlob;
  paths: Record<string, string[]>;
  ignore: NormalizedGlob;
  isIncludeEntryExports: boolean;
}

type PluginConfiguration = EnsuredPluginConfiguration | boolean;

export type PluginsConfiguration = Record<PluginName, PluginConfiguration>;

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

interface BaseOptions {
  rootCwd: string;
  cwd: string;
  manifestScriptNames: Set<string>;
  dependencies: DependencySet;
}

type IsPluginEnabledOptions = {
  cwd: string;
  manifest: PackageJson;
  dependencies: Set<string>;
  config: WorkspaceConfiguration;
};

export type IsPluginEnabled = (options: IsPluginEnabledOptions) => boolean | Promise<boolean>;

export interface PluginOptions extends BaseOptions {
  manifest: PackageJson;
  config: EnsuredPluginConfiguration;
  configFileDir: string;
  configFileName: string;
  configFilePath: string;
  isProduction: boolean;
  enabledPlugins: string[];
  getDependenciesFromScripts: GetDependenciesFromScriptsP;
}

export type ResolveEntryPaths<T = any> = (config: T, options: PluginOptions) => Promise<Dependency[]> | Dependency[];

export type ResolveConfig<T = any> = (config: T, options: PluginOptions) => Promise<Dependency[]> | Dependency[];

export type Resolve = (options: PluginOptions) => Promise<Dependency[]> | Dependency[];

export interface Plugin {
  title: string;
  note?: string;
  args?: Args;
  packageJsonPath?: string | ((manifest: PackageJson) => string);
  enablers?: IgnorePatterns | string;
  isEnabled?: IsPluginEnabled;
  config?: string[];
  entry?: string[];
  production?: string[];
  project?: string[];
  resolveEntryPaths?: ResolveEntryPaths;
  resolveConfig?: ResolveConfig;
  resolve?: Resolve;
}

export type PluginMap = Record<PluginName, Plugin>;

export type Entries = [PluginName, Plugin][];
