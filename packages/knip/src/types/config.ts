import type ts from 'typescript';
import type { z } from 'zod/mini';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { knipConfigurationSchema } from '../schema/configuration.js';
import type { pluginSchema } from '../schema/plugins.js';
import type { Input } from '../util/input.js';
import type { Args } from './args.js';
import type { IssueType, SymbolType } from './issues.js';
import type { Tags } from './options.js';
import type { PluginName } from './PluginNames.js';
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

type IgnorableExport = Exclude<SymbolType, 'unknown'>;

export type IgnoreExportsUsedInFile = boolean | Partial<Record<IgnorableExport, boolean>>;

export type IgnoreIssues = Record<string, IssueType[]>;

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  isReportClassMembers: boolean;
  tags: Tags;
};

export interface Configuration {
  ignore: NormalizedGlob;
  ignoreFiles: NormalizedGlob;
  ignoreBinaries: IgnorePatterns;
  ignoreDependencies: IgnorePatterns;
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile;
  ignoreIssues?: IgnoreIssues;
  ignoreMembers: IgnorePatterns;
  ignoreUnresolved: IgnorePatterns;
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
  ignoreFiles: NormalizedGlob;
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

type PluginSetup = (options: PluginOptions) => Promise<void> | void;

type PluginTeardown = (options: PluginOptions) => Promise<void> | void;

export type IsLoadConfig = (options: PluginOptions, dependencies: Set<string>) => boolean;

export type ResolveConfig<T = any> = (config: T, options: PluginOptions) => Promise<Input[]> | Input[];

export type Resolve = (options: PluginOptions) => Promise<Input[]> | Input[];

export type GetSourceFile = (filePath: string) => ts.SourceFile | undefined;

export type GetReferencedInternalFilePath = (input: Input) => string | undefined;

export type ResolveFromAST = (
  sourceFile: ts.SourceFile,
  options: PluginOptions & {
    getSourceFile: GetSourceFile;
    getReferencedInternalFilePath: GetReferencedInternalFilePath;
  }
) => Input[];

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
  setup?: PluginSetup;
  teardown?: PluginTeardown;
  isLoadConfig?: IsLoadConfig;
  resolveConfig?: ResolveConfig;
  resolve?: Resolve;
  resolveFromAST?: ResolveFromAST;
}

export type PluginMap = Record<PluginName, Plugin>;

export type Entries = [PluginName, Plugin][];
