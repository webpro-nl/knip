export type YarnConfig = {
  plugins?: Array<string | { path?: string }>;
  yarnPath?: string;
  packageExtensions?: Record<
    string,
    {
      peerDependencies?: Record<string, string>;
    }
  >;
};
