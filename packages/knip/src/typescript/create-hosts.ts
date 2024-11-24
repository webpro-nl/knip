import { EOL } from 'node:os';
// biome-ignore lint/nursery/noRestrictedImports: ignore
import path from 'node:path';
import ts from 'typescript';
import { getCompilerExtensions } from '../compilers/index.js';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';
import { SourceFileManager } from './SourceFileManager.js';
import { createCustomModuleResolver } from './resolve-module-names.js';

const libLocation = path.dirname(ts.getDefaultLibFilePath({}));

type CreateHostsOptions = {
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  entryPaths: Set<string>;
  compilers: [SyncCompilers, AsyncCompilers];
  isSkipLibs: boolean;
  toSourceFilePath: ToSourceFilePath;
  useResolverCache: boolean;
};

export const createHosts = ({
  cwd,
  compilerOptions,
  entryPaths,
  compilers,
  isSkipLibs,
  toSourceFilePath,
  useResolverCache,
}: CreateHostsOptions) => {
  const fileManager = new SourceFileManager({ compilers, isSkipLibs });
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
    resolveModuleNames: (moduleNames, containingFile, _, __, options) => {
      return moduleNames.map(moduleName => {
        // Try to resolve @types for any non-relative, non-absolute import
        if (!moduleName.startsWith('.') && !moduleName.startsWith('/') && !moduleName.startsWith('node:')) {
          // Get the base package name (handle scoped packages and subpaths)
          const basePackage = moduleName.startsWith('@') 
            ? moduleName.split('/').slice(0, 2).join('/')
            : moduleName.split('/')[0];
          
          const typeResult = ts.resolveTypeReferenceDirective(
            basePackage,
            containingFile,
            options,
            {
              fileExists: ts.sys.fileExists,
              readFile: ts.sys.readFile,
              directoryExists: ts.sys.directoryExists,
              getCurrentDirectory: () => cwd,
              getDirectories: ts.sys.getDirectories,
            }
          );
          
          if (typeResult.resolvedTypeReferenceDirective?.resolvedFileName) {
            return {
              resolvedFileName: typeResult.resolvedTypeReferenceDirective.resolvedFileName,
              isExternalLibraryImport: true,
              extension: '.d.ts',
            };
          }
        }
        
        // Fall back to normal module resolution
        return resolveModuleNames([moduleName], containingFile)[0];
      });
    },
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
