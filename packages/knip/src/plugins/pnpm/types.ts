export type PnpmConfig = {
  pnpm?: {
    packageExtensions?: Record<
      string,
      {
        peerDependencies?: Record<string, string>;
      }
    >;
  };
  packageExtensions?: Record<
    string,
    {
      peerDependencies?: Record<string, string>;
    }
  >;
};
