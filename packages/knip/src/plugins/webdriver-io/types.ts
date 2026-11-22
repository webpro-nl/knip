export type WebdriverIOConfig = {
  config: {
    framework?: string;
    runner?: string | [string, unknown];
    reporters?: unknown[];
    services?: unknown[];
  };
};
