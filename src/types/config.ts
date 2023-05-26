import { z } from 'zod';
import { ConfigurationValidator } from '../ConfigurationValidator.js';
import * as Plugins from '../plugins/index.js';
import { Rules } from './issues.js';
import type { SyncCompilers, AsyncCompilers } from '../types/compilers.js';

export type RawConfiguration = z.infer<typeof ConfigurationValidator>;

type NormalizedGlob = string[];

export type PluginName = keyof typeof Plugins;

export type PluginConfiguration =
  | {
      config: NormalizedGlob | null;
      entry: NormalizedGlob | null;
      project: NormalizedGlob | null;
    }
  | false;

type PluginsConfiguration = Record<PluginName, PluginConfiguration>;

interface BaseWorkspaceConfiguration {
  entry: NormalizedGlob;
  project: NormalizedGlob;
  paths: Record<string, string[]>;
  ignore: NormalizedGlob;
  ignoreBinaries: string[];
  ignoreDependencies: string[];
}

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

type IgnorableExport = 'class' | 'enum' | 'function' | 'interface' | 'member' | 'type';

export interface Configuration {
  rules: Rules;
  include: string[];
  exclude: string[];
  ignore: NormalizedGlob;
  ignoreBinaries: string[];
  ignoreDependencies: string[];
  ignoreExportsUsedInFile: boolean | Partial<Record<IgnorableExport, boolean>>;
  ignoreWorkspaces: string[];
  workspaces: Record<string, WorkspaceConfiguration>;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;
}
