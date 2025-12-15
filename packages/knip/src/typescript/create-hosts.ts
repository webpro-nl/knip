import { EOL } from 'node:os';
// biome-ignore lint: style/noRestrictedImports
import path from 'node:path';
import ts from 'typescript';
import { getCompilerExtensions } from '../compilers/index.js';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';
import { createCustomModuleResolver } from './resolve-module-names.js';
import type { SourceFileManager } from './SourceFileManager.js';

const libLocation = path.dirname(ts.getDefaultLibFilePath({}));

type CreateHostsOptions = {
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  entryPaths: Set<string>;
  compilers: [SyncCompilers, AsyncCompilers];
  toSourceFilePath: ToSourceFilePath;
  useResolverCache: boolean;
  fileManager: SourceFileManager;
};

export const createHosts = ({
  cwd,
  compilerOptions,
  fileManager,
  entryPaths,
  compilers,
  toSourceFilePath,
  useResolverCache,
}: CreateHostsOptions) => {
  const compilerExtensions = getCompilerExtensions(compilers);
  const resolveModuleNames = createCustomModuleResolver(
    compilerOptions,
    compilerExtensions,
    toSourceFilePath,
    useResolverCache
  );

  const languageServiceHost: ts.LanguageServiceHost = {
    getCompilationSettings: () => compilerOptions,
    getScriptFileNames: () => Array.from(entryPaths),
    getScriptVersion: () => '0',
    getScriptSnapshot: (fileName: string) => fileManager.getSnapshot(fileName),
    getCurrentDirectory: () => cwd,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    readFile: ts.sys.readFile,
    fileExists: ts.sys.fileExists,
    resolveModuleNames,
  };

  const compilerHost: ts.CompilerHost = {
    writeFile: () => undefined,
    getDefaultLibLocation: () => libLocation,
    getDefaultLibFileName: languageServiceHost.getDefaultLibFileName,
    getSourceFile: (fileName: string) => fileManager.getSourceFile(fileName),
    getCurrentDirectory: languageServiceHost.getCurrentDirectory,
    getCanonicalFileName: (fileName: string) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => EOL,
    readFile: languageServiceHost.readFile,
    fileExists: languageServiceHost.fileExists,
    resolveModuleNames: languageServiceHost.resolveModuleNames,
  };

  return { fileManager, compilerHost, resolveModuleNames, languageServiceHost };
};
