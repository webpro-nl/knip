import path from 'node:path';
import ts from 'typescript';
import { isAbsolute } from '../util/path.js';
import { ensureRealFilePath, isVirtualFilePath } from './utils.js';

export function createCustomModuleResolver(
  customSys: typeof ts.sys,
  compilerOptions: ts.CompilerOptions,
  virtualFileExtensions: string[]
) {
  function resolveModuleNames(moduleNames: string[], containingFile: string): Array<ts.ResolvedModule | undefined> {
    return moduleNames.map(moduleName => resolveModuleName(moduleName, containingFile));
  }

  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModule | undefined {
    const tsResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, ts.sys).resolvedModule;

    if (tsResolvedModule && !isAbsolute(tsResolvedModule?.resolvedFileName)) {
      // TODO Why is it necessary, and is this the place to monkey-patch import specifiers like 'src/local/module'?
      tsResolvedModule.resolvedFileName = path.join(customSys.getCurrentDirectory(), tsResolvedModule.resolvedFileName);
    }

    if (virtualFileExtensions.length === 0) return tsResolvedModule;

    if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return tsResolvedModule;
    }

    const customResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, customSys).resolvedModule;

    if (!customResolvedModule || !isVirtualFilePath(customResolvedModule.resolvedFileName, virtualFileExtensions)) {
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
