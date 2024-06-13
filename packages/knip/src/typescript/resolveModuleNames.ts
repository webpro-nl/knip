import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { createMatchPath } from 'tsconfig-paths';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS, FOREIGN_FILE_EXTENSIONS } from '../constants.js';
import { timerify } from '../util/Performance.js';
import { sanitizeSpecifier } from '../util/modules.js';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.js';
import { resolveSync } from '../util/resolve.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';
import { isDeclarationFileExtension } from './ast-helpers.js';
import { ensureRealFilePath, isVirtualFilePath } from './sys.js';

const resolutionCache = new Map<string, ts.ResolvedModuleFull | undefined>();

const fileExists = (name: string, containingFile: string) => {
  const resolvedFileName = isAbsolute(name) ? name : join(dirname(containingFile), name);
  if (existsSync(resolvedFileName)) {
    return {
      resolvedFileName,
      extension: extname(name),
      isExternalLibraryImport: false,
      resolvedUsingTsExtension: false,
    };
  }
};

export type ResolveModuleNames = ReturnType<typeof createCustomModuleResolver>;

export function createCustomModuleResolver(
  customSys: typeof ts.sys,
  compilerOptions: ts.CompilerOptions,
  virtualFileExtensions: string[],
  toSourceFilePath: ToSourceFilePath,
  useCache = true
) {
  const extensions = [...DEFAULT_EXTENSIONS, ...virtualFileExtensions];

  function resolveModuleNames(moduleNames: string[], containingFile: string): Array<ts.ResolvedModuleFull | undefined> {
    return moduleNames.map(moduleName => {
      if (!useCache) return resolveModuleName(moduleName, containingFile);

      const key = moduleName.startsWith('.')
        ? join(dirname(containingFile), moduleName)
        : `${containingFile}:${moduleName}`;

      if (resolutionCache.has(key)) return resolutionCache.get(key);

      const resolvedModule = resolveModuleName(moduleName, containingFile);

      // Don't save resolution misses, because it might be resolved later under a different principal
      if (resolvedModule) resolutionCache.set(key, resolvedModule);

      return resolvedModule;
    });
  }

  const tsMatchPath = createMatchPath(
    // If `baseUrl` is undefined we have already modified `paths` so that all
    // entries are absolute. See `mergePaths` in `src/PrincipalFactory.ts`.
    compilerOptions.baseUrl ?? '/',
    compilerOptions.paths || {}
  );

  /**
   * - Virtual files have built-in or custom compiler, return as JS
   * - Foreign files have path resolved verbatim (file manager will return empty source file)
   * - For dist/outDir and DTS files an attempt is made to resolve to src path
   */
  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModuleFull | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    // No need to try and resolve builtins or externals, bail out
    if (isBuiltin(sanitizedSpecifier) || isInNodeModules(name)) return undefined;

    const resolvedFileName = resolveSync(sanitizedSpecifier, containingFile, extensions);
    if (resolvedFileName) {
      const ext = extname(resolvedFileName);

      if (!virtualFileExtensions.includes(ext) && !FOREIGN_FILE_EXTENSIONS.has(ext)) {
        const srcFilePath = toSourceFilePath(resolvedFileName);
        if (srcFilePath) {
          return {
            resolvedFileName: srcFilePath,
            extension: extname(srcFilePath),
            isExternalLibraryImport: false,
            resolvedUsingTsExtension: false,
          };
        }
      }

      return {
        resolvedFileName,
        extension: virtualFileExtensions.includes(ext) ? ts.Extension.Js : ext,
        isExternalLibraryImport: isInNodeModules(resolvedFileName),
        resolvedUsingTsExtension: false,
      };
    }

    const tsResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      ts.sys
    ).resolvedModule;

    if (tsResolvedModule) {
      if (isDeclarationFileExtension(tsResolvedModule.extension)) {
        const srcFilePath = toSourceFilePath(tsResolvedModule.resolvedFileName);

        if (srcFilePath) {
          return {
            resolvedFileName: srcFilePath,
            extension: extname(srcFilePath),
            isExternalLibraryImport: false,
            resolvedUsingTsExtension: false,
          };
        }
      }

      return tsResolvedModule;
    }

    const customResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      customSys
    ).resolvedModule;

    if (customResolvedModule) {
      if (isVirtualFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions)) {
        const resolvedFileName = ensureRealFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions);

        return {
          extension: ts.Extension.Js,
          resolvedFileName,
          isExternalLibraryImport: customResolvedModule.isExternalLibraryImport,
        };
      }

      return customResolvedModule;
    }

    const module = fileExists(sanitizedSpecifier, containingFile);
    if (module) return module;

    const resolvedPathMap = tsMatchPath(
      sanitizedSpecifier,
      undefined,
      undefined,
      // Leave extensions empty. When resolving "@foo/bar.ext",
      // "@foo/bar.ext.js" will not be tried if "./foo/bar.ext" does not exist.
      // This case has been handled by the resolvers above. This makes the
      // resolution faster.
      []
    );
    if (resolvedPathMap) {
      return {
        resolvedFileName: resolvedPathMap,
        extension: extname(resolvedPathMap),
        isExternalLibraryImport: false,
      };
    }

    return undefined;
  }

  return timerify(resolveModuleNames);
}
