import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from '../constants.js';
import { sanitizeSpecifier } from '../util/modules.js';
import { dirname, extname, isAbsolute, isInNodeModules, isInternal, join } from '../util/path.js';
import { resolveSync } from '../util/resolve.js';
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

export function createCustomModuleResolver(
  customSys: typeof ts.sys,
  compilerOptions: ts.CompilerOptions,
  virtualFileExtensions: string[],
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
      if (resolvedModule) {
        resolutionCache.set(key, resolvedModule);
      }
      return resolvedModule;
    });
  }

  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModuleFull | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    // No need to try and resolve builtins or externals, bail out
    if (isBuiltin(sanitizedSpecifier) || isInNodeModules(name)) return undefined;

    {
      const resolvedFileName = resolveSync(sanitizedSpecifier, containingFile, extensions);
      if (resolvedFileName) {
        const ext = extname(resolvedFileName);
        const extension = virtualFileExtensions.includes(ext) ? ts.Extension.Js : ext;
        return {
          resolvedFileName: resolvedFileName,
          extension,
          isExternalLibraryImport: isInNodeModules(resolvedFileName),
          resolvedUsingTsExtension: false,
        };
      }
    }

    const tsResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      ts.sys
    ).resolvedModule;

    if (
      tsResolvedModule &&
      isDeclarationFileExtension(tsResolvedModule.extension) &&
      isInternal(tsResolvedModule.resolvedFileName)
    ) {
      if (tsResolvedModule.extension === '.d.mts') {
        const resolvedFileName = tsResolvedModule.resolvedFileName.replace(/\.d\.mts$/, '.mjs');
        return { resolvedFileName, extension: '.mjs', isExternalLibraryImport: false, resolvedUsingTsExtension: false };
      }

      if (tsResolvedModule.extension === '.d.cts') {
        const resolvedFileName = tsResolvedModule.resolvedFileName.replace(/\.d\.cts$/, '.cjs');
        return { resolvedFileName, extension: '.cjs', isExternalLibraryImport: false, resolvedUsingTsExtension: false };
      }

      const base = tsResolvedModule.resolvedFileName.replace(/\.d\.ts$/, '');
      const baseExt = extname(base);

      if (baseExt && virtualFileExtensions.includes(baseExt)) {
        const resolvedFileName = ensureRealFilePath(base, virtualFileExtensions);
        return {
          resolvedFileName,
          extension: ts.Extension.Js,
          isExternalLibraryImport: false,
          resolvedUsingTsExtension: false,
        };
      }

      for (const ext of ['.js', '.jsx']) {
        const module = fileExists(base + ext, containingFile);
        if (module) return module;
      }

      return tsResolvedModule;
    }

    if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return tsResolvedModule;
    }

    const customResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      customSys
    ).resolvedModule;

    if (!(customResolvedModule && isVirtualFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions))) {
      const module = fileExists(sanitizedSpecifier, containingFile);
      if (module) return module;
      return customResolvedModule;
    }

    const resolvedFileName = ensureRealFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions);

    const resolvedModule: ts.ResolvedModuleFull = {
      extension: ts.Extension.Js,
      resolvedFileName,
      isExternalLibraryImport: customResolvedModule.isExternalLibraryImport,
    };

    return resolvedModule;
  }

  return resolveModuleNames;
}
