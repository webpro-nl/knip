import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { timerify } from '../util/Performance.js';
import { sanitizeSpecifier } from '../util/modules.js';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.js';
import { _resolveSync, createSyncResolver } from '../util/resolve.js';
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
  useCache = true,
  isSkipLibs = true
) {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions];
  const resolveSync = customCompilerExtensionsSet.size === 0 ? _resolveSync : createSyncResolver(extensions);

  const virtualDeclarationFiles = new Map<string, { path: string; ext: string }>();

  const tsSys: ts.System = {
    ...ts.sys,
    // We trick TypeScript into resolving paths with arbitrary extensions. When
    // a module "./module.ext" is imported TypeScript only tries to resolve it to
    // "./module.d.ext.ts". TypeScript never checks whether "./module.ext" itself exists.
    // So, if TypeScript checks whether "./module.d.ext.ts" exists and the file
    // does not exist we can assume the compiler wants to resolve `./module.ext`.
    // If the latter exists we return true and record this fact in
    // `virtualDeclarationFiles`.
    fileExists(path: string) {
      if (ts.sys.fileExists(path)) {
        return true;
      }

      const original = originalFromDeclarationPath(path);
      if (original && ts.sys.fileExists(original.path)) {
        virtualDeclarationFiles.set(path, original);
        return true;
      }

      return false;
    },
  };

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

  /**
   * - Virtual files have built-in or custom compiler, return as JS
   * - Foreign files have path resolved verbatim (file manager will return empty source file)
   * - For dist/outDir and DTS files an attempt is made to resolve to src path
   */
  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModuleFull | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    // No need to try and resolve builtins, bail out
    if (isBuiltin(sanitizedSpecifier)) return undefined;

    const resolvedFileName = isSkipLibs && resolveSync(sanitizedSpecifier, dirname(containingFile));

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

    const tsResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      tsSys
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
      const original = virtualDeclarationFiles.get(tsResolvedModule.resolvedFileName);
      if (original) {
        return {
          ...tsResolvedModule,
          resolvedFileName: original.path,
          extension: customCompilerExtensionsSet.has(original.ext) ? ts.Extension.Js : original.ext,
        };
      }

      return tsResolvedModule;
    }

    const module = fileExists(sanitizedSpecifier, containingFile);
    if (module) return module;

    return undefined;
  }

  return timerify(resolveModuleNames);
}

const declarationPathRe = /^(.*)\.d(\.[^.]+)\.ts$/;

/**
 * For paths that look like `.../module.d.yyy.ts` returns path `.../module.yyy` and
 * ext `yyy`.
 */
function originalFromDeclarationPath(path: string): { path: string; ext: string } | undefined {
  const match = declarationPathRe.exec(path);
  if (match) {
    return {
      path: match[1] + match[2],
      ext: match[2],
    };
  }
}
