export type NetlifyConfig = {
  plugins?: {
    package: string;
  }[];
  functions?: FunctionsConfig;
};

export type FunctionsConfig = {
  directory?: string;
  external_node_modules?: string[];
  included_files?: string[];
};
