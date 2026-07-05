export type PluginConfig = {
  build?: {
    esbuild?: EsbuildConfig;
  };
  custom?: {
    esbuild?: EsbuildConfig;
  };
  functions?: Record<string, ServerlessFunction>;
  plugins?: unknown[];
};

export type EsbuildConfig =
  | {
      inject?: string | string[];
    }
  | boolean;

type ServerlessFunction = {
  handler?: string;
};
