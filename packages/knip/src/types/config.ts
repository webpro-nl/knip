import type ts from 'typescript';
import type { z } from 'zod/mini';
import type { AsyncCompilers, CompilerSync, HasDependency, SyncCompilers } from '../compilers/types.ts';
import type { knipConfigurationSchema, workspaceConfigurationSchema } from '../schema/configuration.ts';
import type { pluginSchema } from '../schema/plugins.ts';
import type { ImportVisitor, ScriptVisitor } from '../typescript/visitors/index.ts';
import type { ParsedCLIArgs } from '../util/cli-arguments.ts';
import type { Input } from '../util/input.ts';
import type { Args } from './args.ts';
import type { IssueType, SymbolType } from './issues.ts';
import type { Tags } from './options.ts';
import type { PluginName } from './PluginNames.ts';
import type { PackageJson } from './package-json.ts';

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

export type RawConfigurationOrFn =
  | RawConfiguration
  | ((options: ParsedCLIArgs) => RawConfiguration | Promise<RawConfiguration>);

export type RawPluginConfiguration = z.infer<typeof pluginSchema>;

export type WorkspaceProjectConfig = z.infer<typeof workspaceConfigurationSchema>;

export type IgnorePatterns = (string | RegExp)[];

type IgnorableExport = Exclude<SymbolType, 'unknown'>;

export type IgnoreExportsUsedInFile = boolean | Partial<Record<IgnorableExport, boolean>>;

export type IgnoreIssues = Record<string, IssueType[]>;

export type GetImportsAndExportsOptions = {
  skipTypeOnly: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  isReportClassMembers: boolean;
  isReportExports: boolean;
  tags: Tags;
};

export interface Configuration {
  ignore: NormalizedGlob;
  ignoreBinaries: IgnorePatterns;
  ignoreDependencies: IgnorePatterns;
  ignoreExportsUsedInFile: IgnoreExportsUsedInFile;
  ignoreFiles: NormalizedGlob;
  ignoreIssues: IgnoreIssues;
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
  rootManifest: PackageJson | undefined;
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

type PluginSetup = () => Promise<void> | void;

export type IsLoadConfig = (options: PluginOptions, dependencies: Set<string>) => boolean;

export type ResolveConfig<T = any> = (config: T, options: PluginOptions) => Promise<Input[]> | Input[];

export type Resolve = (options: PluginOptions) => Promise<Input[]> | Input[];

export type GetSourceFile = (filePath: string) => ts.SourceFile | undefined;

export type HandleInput = (input: Input) => string | undefined;

export type RegisterCompilerInput = {
  extension: string;
  compiler: CompilerSync;
};

export type RegisterCompiler = (input: RegisterCompilerInput) => void;

export type ResolveFromAST = (
  sourceFile: ts.SourceFile,
  options: PluginOptions & {
    getSourceFile: GetSourceFile;
  }
) => Input[];

export type RegisterCompilersOptions = {
  cwd: string;
  hasDependency: HasDependency;
  registerCompiler: RegisterCompiler;
};

export type RegisterCompilers = (options: RegisterCompilersOptions) => Promise<void> | void;

export type Visitors = { dynamicImport: ImportVisitor[]; script: ScriptVisitor[] };

export type RegisterVisitor = (visitors: Partial<Visitors>) => void;

export type RegisterVisitorsOptions = {
  registerVisitors: RegisterVisitor;
};

export type RegisterVisitors = (options: RegisterVisitorsOptions) => void;

export interface Plugin {
  title: string;
  args?: Args;
  packageJsonPath?: string | ((manifest: PackageJson) => unknown);
  enablers?: IgnorePatterns | string;
  isEnabled?: IsPluginEnabled;
  isRootOnly?: boolean;
  config?: string[] | ((options: { cwd: string }) => string[]);
  entry?: string[];
  production?: string[];
  project?: string[];
  setup?: PluginSetup;
  isLoadConfig?: IsLoadConfig;
  resolveConfig?: ResolveConfig;
  resolve?: Resolve;
  resolveFromAST?: ResolveFromAST;
  isFilterTransitiveDependencies?: boolean;
  registerCompilers?: RegisterCompilers;
  registerVisitors?: RegisterVisitors;
}

export type PluginMap = Record<PluginName, Plugin>;

export type Entries = [PluginName, Plugin][];
