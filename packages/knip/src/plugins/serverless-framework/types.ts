export type PluginConfig = {
  service: string;
  functions: FunctionsCollection;
  plugins?: string[];
  entryPathsOrPatterns?: string[];
};

type FunctionsCollection = {
  [key: string | number]: Function;
};

type Function = {
  handler: string;
};
