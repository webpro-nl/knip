export interface NxProjectConfiguration {
  targets?: {
    [targetName: string]: {
      command?: string;
      executor?: string;
      options?: {
        command?: string;
        commands?: Array<string | { command: string }>;
      };
    };
  };
}

export interface NxConfigRoot {
  plugins?: Array<
    | string
    | {
        plugin: string;
      }
  >;
  generators?: Record<string, unknown>;
  targetDefaults?: Record<string, unknown>;
}
