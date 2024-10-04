import type { z } from 'zod';
import type { ConfigurationValidator, pluginSchema } from '../ConfigurationValidator.js';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type * as Plugins from '../plugins/index.js';
import type { IssueType, Rules } from './issues.js';

export type RawConfiguration = z.infer<typeof ConfigurationValidator>;

export type RawPluginConfiguration = z.infer<typeof pluginSchema>;

type NormalizedGlob = string[];

export type IgnorePatterns = (string | RegExp)[];

export type EnablerPatterns = IgnorePatterns;

export type PluginName = keyof typeof Plugins;

export type PluginMap = typeof Plugins;

export type EnsuredPluginConfiguration = {
  config: NormalizedGlob | null;
  entry: NormalizedGlob | null;
  project: NormalizedGlob | null;
};

type PluginConfiguration = EnsuredPluginConfiguration | boolean;

export type PluginsConfiguration = Record<PluginName, PluginConfiguration>;

interface BaseWorkspaceConfiguration {
  entry: NormalizedGlob;
  project: NormalizedGlob;
  paths: Record<string, string[]>;
  ignore: NormalizedGlob;
  isIncludeEntryExports: boolean;
}

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

type IgnorableExport = 'class' | 'enum' | 'function' | 'interface' | 'member' | 'type';

export type IgnoreExportsUsedInFile = boolean | Partial<Record<IgnorableExport, boolean>>;

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
