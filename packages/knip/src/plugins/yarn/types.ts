import type { PackageExtensions } from '../../types/package-json.ts';

export type YarnConfig = {
  plugins?: Array<string | { path?: string }>;
  yarnPath?: string;
  packageExtensions?: PackageExtensions;
};
