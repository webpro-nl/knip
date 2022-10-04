import { SourceFile } from 'ts-morph';

export type Configuration = {
  cwd: string;
  entryFiles: string[];
  filePatterns: string[];
  isShowProgress: boolean;
  isFindUnusedFiles?: boolean;
  isFindUnusedExports?: boolean;
  isFindUnusedTypes?: boolean;
  isFindDuplicateExports?: boolean;
  isIgnoreNamespaceImports?: boolean;
};

export type Issue = { sourceFile: SourceFile; name: string };
export type Issues = Issue[];
