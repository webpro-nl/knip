import type { Dependencies, PackageJson } from '../../types/package-json.ts';

export type PnpmConfig = PackageJson & {
  packageExtensions?: Record<
    string,
    {
      peerDependencies?: Dependencies;
    }
  >;
};
