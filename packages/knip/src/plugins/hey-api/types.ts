export type PluginConfig = {
  output: string | { path: string };
  plugins?: (string | { name: string; _dependencies?: string[] })[];
};
