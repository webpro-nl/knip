export type YarnConfig = {
  plugins?: Array<string | { path?: string }>;
  yarnPath?: string;
  packageExtensions?: Record<
    string,
    {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }
  >;
};
