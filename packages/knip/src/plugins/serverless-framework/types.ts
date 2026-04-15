export type PluginConfig = {
  functions?: Record<string, ServerlessFunction>;
};

type ServerlessFunction = {
  handler: string;
};
