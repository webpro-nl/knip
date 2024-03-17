import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import ts from 'typescript';
import { sanitizeSpecifier } from '../util/modules.js';
import { basename, dirname, extname, format, isAbsolute, isInNodeModules, isInternal, join } from '../util/path.js';
import { isDeclarationFileExtension } from './ast-helpers.js';
import { ensureRealFilePath, isVirtualFilePath } from './utils.js';

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

const DTS_EXTENSIONS_MAP = {
  [ts.Extension.Dts]: ts.Extension.Js,
  [ts.Extension.Dmts]: ts.Extension.Mjs,
  [ts.Extension.Dcts]: ts.Extension.Cjs,
} as const;

const jsMatchingDeclarationFileExists = (resolveDtsFileName: string, dtsExtension: string) => {
  const extension = DTS_EXTENSIONS_MAP[dtsExtension as keyof typeof DTS_EXTENSIONS_MAP];
  const resolvedFileName = format({
    ext: extension,
    dir: dirname(resolveDtsFileName),
    name: basename(resolveDtsFileName, dtsExtension),
  });

  if (existsSync(resolvedFileName)) {
    return {
      resolvedFileName,
      extension,
      isExternalLibraryImport: false,
      resolvedUsingTsExtension: false,
    };
  }
};

export function createCustomModuleResolver(
  customSys: typeof ts.sys,
  compilerOptions: ts.CompilerOptions,
  virtualFileExtensions: string[]
) {
  function resolveModuleNames(moduleNames: string[], containingFile: string): Array<ts.ResolvedModuleFull | undefined> {
    return moduleNames.map(moduleName => {
      const key = moduleName.startsWith('.')
        ? join(dirname(containingFile), moduleName)
        : `${containingFile}:${moduleName}`;
      if (resolutionCache.has(key)) return resolutionCache.get(key)!;
      const resolvedModule = resolveModuleName(moduleName, containingFile);
      resolutionCache.set(key, resolvedModule);
      return resolvedModule;
    });
  }

  function resolveModuleName(name: string, containingFile: string): ts.ResolvedModuleFull | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    // No need to try and resolve builtins, bail out
    if (isBuiltin(sanitizedSpecifier)) return undefined;
    if (isInNodeModules(name)) return undefined;

    const tsResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      ts.sys
    ).resolvedModule;

    // When TS does not resolve it, and it's not a registered virtual file ext, try `fs.existsSync`
    if (!tsResolvedModule) {
      const extension = extname(sanitizedSpecifier);
      if (extension && !virtualFileExtensions.includes(extension)) {
        const module = fileExists(sanitizedSpecifier, containingFile);
        if (module) return module;
      }
    }

    // This turns resolved local `.d.ts` filenames into `.js` (if specifier has the extension and file exists),
    // because there can be both module.d.ts and module.js and we want the latter.
    if (
      tsResolvedModule &&
      isDeclarationFileExtension(tsResolvedModule.extension) &&
      isInternal(tsResolvedModule.resolvedFileName)
    ) {
      {
        const module = jsMatchingDeclarationFileExists(tsResolvedModule.resolvedFileName, tsResolvedModule.extension);
        if (module) return module;
      }
      {
        const module = fileExists(sanitizedSpecifier, containingFile);
        if (module) return module;
      }
    }

    if (virtualFileExtensions.length === 0) return tsResolvedModule;

    if (tsResolvedModule && !isVirtualFilePath(tsResolvedModule.resolvedFileName, virtualFileExtensions)) {
      return tsResolvedModule;
    }

    const customResolvedModule = ts.resolveModuleName(
      sanitizedSpecifier,
      containingFile,
      compilerOptions,
      customSys
    ).resolvedModule;

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
