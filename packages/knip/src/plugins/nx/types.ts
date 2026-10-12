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

type NxCollectionEntry =
  | string
  | {
      factory?: string;
      implementation?: string;
      batchImplementation?: string;
    };

export type NxCollection = Record<string, Record<string, NxCollectionEntry> | undefined>;

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
