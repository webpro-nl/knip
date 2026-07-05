import type { Dependencies } from '../../types/package-json.ts';

export type YarnConfig = {
  plugins?: Array<string | { path?: string }>;
  yarnPath?: string;
  packageExtensions?: Record<
    string,
    {
      peerDependencies?: Dependencies;
    }
  >;
};
