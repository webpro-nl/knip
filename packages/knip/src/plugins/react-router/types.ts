export type PluginConfig = {
  appDirectory?: string;
};

export interface RouteConfigEntry {
  file: string;
  children?: RouteConfigEntry[];
}
