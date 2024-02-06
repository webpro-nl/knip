export interface NxProjectConfiguration {
  targets?: {
    [targetName: string]: {
      executor?: string;
      options?: {
        command?: string;
        commands?: string[];
      };
    };
  };
}

export interface NxConfigRoot {
  plugins?: Array<{
    plugin: string;
  }>
  generators?: Record<string, unknown>;
  targetDefaults?: Record<string, unknown>;
}