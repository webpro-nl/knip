export type NetlifyConfig = {
  plugins?: {
    package: string;
  }[];
  functions?: FunctionsConfig;
};

export type FunctionsConfig = {
  directory?: string;
  };
