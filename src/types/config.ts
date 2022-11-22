type NormalizedGlob = string[];

export interface PluginConfiguration {
  config: NormalizedGlob;
  entryFiles: NormalizedGlob;
  projectFiles: NormalizedGlob;
}

interface PluginsConfiguration {
  babel: PluginConfiguration;
  capacitor: PluginConfiguration;
  changesets: PluginConfiguration;
  cypress: PluginConfiguration;
  eslint: PluginConfiguration;
  gatsby: PluginConfiguration;
  jest: PluginConfiguration;
  next: PluginConfiguration;
  nx: PluginConfiguration;
  playwright: PluginConfiguration;
  postcss: PluginConfiguration;
  remark: PluginConfiguration;
  remix: PluginConfiguration;
  rollup: PluginConfiguration;
  storybook: PluginConfiguration;
}

interface BaseWorkspaceConfiguration {
  entryFiles: NormalizedGlob;
  projectFiles: NormalizedGlob;
  ignore: NormalizedGlob;
  paths: Record<string, string[]>;
}

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

export type PluginName = keyof PluginsConfiguration;

export interface Configuration {
  include: string[];
  exclude: string[];
  workspaces: Record<string, WorkspaceConfiguration>;
  ignoreBinaries: string[];
  ignoreFiles: string[];
  ignoreWorkspaces: string[];
}
