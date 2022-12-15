type NormalizedGlob = string[];

export interface PluginConfiguration {
  config: NormalizedGlob;
  entry: NormalizedGlob;
  project: NormalizedGlob;
}

interface PluginsConfiguration {
  babel: PluginConfiguration;
  capacitor: PluginConfiguration;
  changesets: PluginConfiguration;
  cypress: PluginConfiguration;
  eslint: PluginConfiguration;
  gatsby: PluginConfiguration;
  jest: PluginConfiguration;
  mocha: PluginConfiguration;
  next: PluginConfiguration;
  nx: PluginConfiguration;
  playwright: PluginConfiguration;
  postcss: PluginConfiguration;
  remark: PluginConfiguration;
  remix: PluginConfiguration;
  rollup: PluginConfiguration;
  storybook: PluginConfiguration;
  stryker: PluginConfiguration;
  typescript: PluginConfiguration;
  webpack: PluginConfiguration;
}

interface BaseWorkspaceConfiguration {
  entry: NormalizedGlob;
  project: NormalizedGlob;
  ignore: NormalizedGlob;
}

export interface WorkspaceConfiguration extends BaseWorkspaceConfiguration, Partial<PluginsConfiguration> {}

export type PluginName = keyof PluginsConfiguration;

export interface Configuration {
  include: string[];
  exclude: string[];
  ignore: NormalizedGlob;
  ignoreBinaries: string[];
  ignoreWorkspaces: string[];
  workspaces: Record<string, WorkspaceConfiguration>;
}
