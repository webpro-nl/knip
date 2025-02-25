import type { z } from 'zod';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { knipConfigurationSchema } from '../schema/configuration.js';
import type { pluginSchema } from '../schema/plugins.js';
import type { Input } from '../util/input.js';
import type { PluginName } from './PluginNames.js';
import type { Args } from './args.js';
import type { Tags } from './cli.js';
import type { IssueType, Rules } from './issues.js';
import type { PackageJson } from './package-json.js';

export interface GetInputsFromScriptsOptions extends BaseOptions {
  knownBinsOnly?: boolean;
  containingFilePath: string;
}

export type GetInputsFromScripts<T = GetInputsFromScriptsOptions> = (
  npmScripts: string | string[] | Set<string>,
  options: T
) => Input[];

export type GetInputsFromScriptsPartial = (
  npmScripts: string | string[] | Set<string>,
  options?: Partial<GetInputsFromScriptsOptions>
) => Input[];

export type FromArgs = (args: string[], options?: Partial<GetInputsFromScriptsOptions>) => Input[];

export interface BinaryResolverOptions extends GetInputsFromScriptsOptions {
  fromArgs: FromArgs;
}

export type BinaryResolver = (binary: string, args: string[], options: BinaryResolverOptions) => Input[];

export type RawConfiguration = z.infer<typeof knipConfigurationSchema>;

export type RawPluginConfiguration = z.infer<typeof pluginSchema>;

export type IgnorePatterns = (string | RegExp)[];

type IgnorableExport = 'class' | 'enum' | 'function' | 'interface' | 'member' | 'type';

type IgnoreExportsUsedInFile = boolean | Partial<Record<IgnorableExport, boolean>>;

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

type NormalizedGlob = string[];

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
  getInputsFromScripts: GetInputsFromScriptsPartial;
}

export type ResolveEntryPaths<T = any> = (config: T, options: PluginOptions) => Promise<Input[]> | Input[];

export type ResolveConfig<T = any> = (config: T, options: PluginOptions) => Promise<Input[]> | Input[];

export type Resolve = (options: PluginOptions) => Promise<Input[]> | Input[];

export interface Plugin {
  title: string;
  args?: Args;
  packageJsonPath?: string | ((manifest: PackageJson) => unknown);
  enablers?: IgnorePatterns | string;
  isEnabled?: IsPluginEnabled;
  isRootOnly?: boolean;
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
