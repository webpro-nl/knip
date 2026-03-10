import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.ts';
import { _createSyncModuleResolver, _resolveModuleSync, convertPathsToAlias } from '../util/resolve.ts';
import type { ToSourceFilePath } from '../util/to-source-path.ts';

interface ResolvedModuleFull {
  resolvedFileName: string;
  extension: string;
  isExternalLibraryImport: boolean;
  resolvedUsingTsExtension: boolean;
}

export type ResolveModuleNames = ReturnType<typeof createCustomModuleResolver>;

export function createCustomModuleResolver(
  compilerOptions: { paths?: Record<string, string[]> },
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath
) {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions, '.d.ts', '.d.mts', '.d.cts'];
  const alias = convertPathsToAlias(compilerOptions.paths as Record<string, string[]>);
  const resolveSync = customCompilerExtensionsSet.size > 0 ? _createSyncModuleResolver(extensions) : _resolveModuleSync;
  const resolveWithAlias = alias ? _createSyncModuleResolver(extensions, alias) : undefined;

  function toResult(resolvedFileName: string): ResolvedModuleFull {
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
      extension: customCompilerExtensionsSet.has(ext) ? '.js' : ext,
      isExternalLibraryImport: isInNodeModules(resolvedFileName),
      resolvedUsingTsExtension: false,
    };
  }

  function resolveModuleName(name: string, containingFile: string): ResolvedModuleFull | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    if (isBuiltin(sanitizedSpecifier)) return undefined;

    const resolvedFileName = resolveSync(sanitizedSpecifier, containingFile);
    if (resolvedFileName) return toResult(resolvedFileName);

    if (resolveWithAlias) {
      const aliasResolved = resolveWithAlias(sanitizedSpecifier, containingFile);
      if (aliasResolved) return toResult(aliasResolved);
    }

    const candidate = isAbsolute(sanitizedSpecifier)
      ? sanitizedSpecifier
      : join(dirname(containingFile), sanitizedSpecifier);
    if (existsSync(candidate)) {
      return {
        resolvedFileName: candidate,
        extension: extname(candidate),
        isExternalLibraryImport: false,
        resolvedUsingTsExtension: false,
      };
    }
  }

  return timerify(resolveModuleName);
}
