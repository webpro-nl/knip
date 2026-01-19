export type PluginConfig = {
  service: string;
  functions: FunctionsCollection;
  plugins?: string[];
  entryPathsOrPatterns?: string[];
};

export type FunctionsCollection = {
  [key: string | number]: Function;
};

export type Function = {
  handler: string;
};
