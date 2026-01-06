export interface NxProjectConfiguration {
  targets?: {
    [targetName: string]: {
      command?: string;
      executor?: string;
      options?: {
        command?: string;
        commands?: Array<string | { command: string }>;
        eslintConfig?: string;
        jestConfig?: string;
        tsConfig?: string;
        vitestConfig?: string;
        webpackConfig?: string;
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
