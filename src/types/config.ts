import { z } from 'zod';
import { ConfigurationValidator } from '../configuration-validator.js';
import * as Plugins from '../plugins/index.js';

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
}

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

export interface Configuration {
  include: string[];
  exclude: string[];
  ignore: NormalizedGlob;
  ignoreBinaries: string[];
  ignoreDependencies: string[];
  ignoreWorkspaces: string[];
  workspaces: Record<string, WorkspaceConfiguration>;
}
