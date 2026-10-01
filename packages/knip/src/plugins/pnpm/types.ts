import type { PackageExtensions, PackageJson } from '../../types/package-json.ts';

export type PnpmConfig = PackageJson & {
  packageExtensions?: PackageExtensions;
};
