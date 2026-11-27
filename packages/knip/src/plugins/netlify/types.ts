export type NetlifyConfig = {
  build?: {
    command?: string;
    edge_functions?: string;
  };
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
