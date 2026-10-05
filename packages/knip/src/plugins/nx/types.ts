export interface NxProjectConfiguration {
  targets?: {
    [targetName: string]: {
      command?: string;
      executor?: string;
      options?: {
        command?: string;
        commands?: Array<string | { command: string }>;
        cwd?: string;
        eslintConfig?: string;
        jestConfig?: string;
        tsConfig?: string;
        vitestConfig?: string;
        webpackConfig?: string;
      };
    };
  };
}

export interface NxPackageConfiguration extends NxProjectConfiguration {
  generatorsFile?: unknown;
  executorsFile?: unknown;
  generators?: Record<string, { factory?: string }>;
  executors?: Record<string, { implementation?: string }>;
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
