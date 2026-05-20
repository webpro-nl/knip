export type PluginConfig = {
  build?: {
    esbuild?: unknown;
  };
  custom?: {
    esbuild?: unknown;
  };
  functions?: Record<string, ServerlessFunction>;
  plugins?: unknown[];
};

type ServerlessFunction = {
  handler?: string;
};
