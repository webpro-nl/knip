import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { createMatchPath } from 'tsconfig-paths';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from '../util/Performance.js';
import { sanitizeSpecifier } from '../util/modules.js';
import { dirname, extname, isAbsolute, isInNodeModules, join, toPosix } from '../util/path.js';
import { resolveSync } from '../util/resolve.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';
import { isDeclarationFileExtension } from './ast-helpers.js';

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
  compilerOptions: ts.CompilerOptions,
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath,
  useCache = true
) {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions];

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

      if (!customCompilerExtensionsSet.has(ext)) {
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
        extension: customCompilerExtensionsSet.has(ext) ? ts.Extension.Js : ext,
        isExternalLibraryImport: isInNodeModules(resolvedFileName),
        resolvedUsingTsExtension: false,
      };
    }

    const pathMappedFileName = tsMatchPath(
      sanitizedSpecifier,
      undefined,
      undefined,
      // Leave extensions empty and let `ts.resolveModuleName()` handle that.
      // `tsMatchPath` will strip extensions from the returned specifier which
      // means we don’t get the actual file path.
      []
    );
    if (pathMappedFileName) {
      const ext = extname(pathMappedFileName);
      return {
        resolvedFileName: toPosix(pathMappedFileName),
        extension: customCompilerExtensionsSet.has(ext) ? ts.Extension.Js : ext,
        isExternalLibraryImport: false,
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

    const module = fileExists(sanitizedSpecifier, containingFile);
    if (module) return module;

    return undefined;
  }

  return timerify(resolveModuleNames);
}
