import type { AsyncCompilers, SyncCompilers } from '../compilers/types.ts';
import type { ToSourceFilePath } from '../util/to-source-path.ts';

export type Paths = Record<string, string[]> | undefined;

export interface CompilerOptions {
  allowJs?: boolean;
  allowNonTsExtensions?: boolean;
  allowSyntheticDefaultImports?: boolean;
  baseUrl?: string;
  declaration?: boolean;
  declarationMap?: boolean;
  esModuleInterop?: boolean;
  inlineSourceMap?: boolean;
  inlineSources?: boolean;
  jsx?: number;
  jsxImportSource?: string;
  lib?: string[];
  module?: number;
  moduleResolution?: number;
  noEmit?: boolean;
  outDir?: string;
  paths?: Record<string, string[]>;
  pathsBasePath?: string;
  plugins?: Array<{ name: string } | string>;
  rootDir?: string;
  skipDefaultLibCheck?: boolean;
  skipLibCheck?: boolean;
  sourceMap?: boolean;
  types?: string[];
  [key: string]: unknown;
}

export type PrincipalOptions = {
  dir: string;
  isFile: boolean;
  compilerOptions: CompilerOptions;
  compilers: [SyncCompilers, AsyncCompilers];
  pkgName: string;
  toSourceFilePath: ToSourceFilePath;
};
