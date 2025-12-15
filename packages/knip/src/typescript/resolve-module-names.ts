import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { sanitizeSpecifier } from '../util/modules.js';
import { timerify } from '../util/Performance.js';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.js';
import { _createSyncModuleResolver, _resolveModuleSync } from '../util/resolve.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';
import { isDeclarationFileExtension } from './ast-helpers.js';

const resolutionCache = new Map<string, ts.ResolvedModuleFull | undefined>();

const moduleIfFileExists = (name: string, containingFile: string) => {
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

const tsResolveModuleName = timerify(ts.resolveModuleName);

export function createCustomModuleResolver(
  compilerOptions: ts.CompilerOptions,
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath,
  useCache = true
) {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions];
  const resolveSync =
    customCompilerExtensionsSet.size === 0 ? _resolveModuleSync : _createSyncModuleResolver(extensions);

  const virtualDeclarationFiles = new Map<string, { path: string; ext: string }>();

  const tsSys: ts.System = {
    ...ts.sys,
    // TS resolves "./module.ext" to "./module.d.ext.ts". If that doesn't exist
    // but the original does, pretend it exists and record the mapping.
    fileExists(path: string) {
      if (ts.sys.fileExists(path)) return true;
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
   * - Foreign files (e.g. .css, .png) have path resolved verbatim (file manager will return empty source file)
   * - For "dist" and DTS files source mapping is attempted
   */
  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModuleFull | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    // No need to try and resolve builtins, bail out
    if (isBuiltin(sanitizedSpecifier)) return undefined;

    const resolvedFileName = resolveSync(sanitizedSpecifier, containingFile);

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

    const tsResolvedModule = tsResolveModuleName(
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

    return moduleIfFileExists(sanitizedSpecifier, containingFile);
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
