type NormalizedGlob = string[];

export type PluginConfiguration =
  | {
      config: NormalizedGlob;
      entry: NormalizedGlob;
      project: NormalizedGlob;
    }
  | false;

interface PluginsConfiguration {
  babel: PluginConfiguration;
  capacitor: PluginConfiguration;
  changesets: PluginConfiguration;
  commitlint: PluginConfiguration;
  cypress: PluginConfiguration;
  eslint: PluginConfiguration;
  gatsby: PluginConfiguration;
  jest: PluginConfiguration;
  mocha: PluginConfiguration;
  next: PluginConfiguration;
  nx: PluginConfiguration;
  nyc: PluginConfiguration;
  playwright: PluginConfiguration;
  postcss: PluginConfiguration;
  remark: PluginConfiguration;
  remix: PluginConfiguration;
  rollup: PluginConfiguration;
  sentry: PluginConfiguration;
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
  ignoreDependencies: string[];
  ignoreWorkspaces: string[];
  workspaces: Record<string, WorkspaceConfiguration>;
}
