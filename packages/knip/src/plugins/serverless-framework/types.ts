export type PluginConfig = {
  build?: {
    esbuild?: EsbuildConfig;
  };
  custom?: {
    esbuild?: EsbuildConfig;
  };
  functions?: Functions | Array<Functions | FileVariable> | FileVariable;
  plugins?: unknown[] | { localPath?: string; modules?: unknown[] } | FileVariable;
};

type FileVariable = string;

type Functions = Record<string, ServerlessFunction | FileVariable>;

export type EsbuildConfig =
  | {
      inject?: string[];
    }
  | boolean;

type ServerlessFunction = {
  handler?: string;
};
