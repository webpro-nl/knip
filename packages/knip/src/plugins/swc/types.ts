export type SWCConfig = {
  jsc?: {
    experimental?: {
      plugins?: Array<[pluginName: string, pluginOptions: Record<string, unknown>]>;
    };
  };
};
