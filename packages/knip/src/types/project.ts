import type ts from 'typescript';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';

export type Paths = ts.CompilerOptions['paths'];

export type PrincipalOptions = {
  dir: string;
  isFile: boolean;
  compilerOptions: ts.CompilerOptions;
  compilers: [SyncCompilers, AsyncCompilers];
  pkgName: string;
  toSourceFilePath: ToSourceFilePath;
};
