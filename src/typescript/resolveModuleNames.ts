import ts from 'typescript';
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
    // How to let TypeScript know about the declaration files to resolve e.g. the `*.html?raw` import specifier?
    const tsResolvedModule = ts.resolveModuleName(name, containingFile, compilerOptions, ts.sys).resolvedModule;

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
