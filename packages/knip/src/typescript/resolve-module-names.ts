import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.ts';
import { _createSyncModuleResolver, _resolveModuleSync, convertPathsToAlias } from '../util/resolve.ts';
import type { ToSourceFilePath } from '../util/to-source-path.ts';

interface ResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport: boolean;
}

export interface CustomModuleResolver {
  resolveModuleName: (name: string, containingFile: string) => ResolvedModule | undefined;
  resolveFileName: (name: string, containingFile: string) => string | undefined;
}

export function createCustomModuleResolver(
  compilerOptions: { paths?: Record<string, string[]> },
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath
): CustomModuleResolver {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const hasCustomExts = customCompilerExtensionsSet.size > 0;
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions, '.d.ts', '.d.mts', '.d.cts'];
  const alias = convertPathsToAlias(compilerOptions.paths as Record<string, string[]>);
  const resolveSync = hasCustomExts ? _createSyncModuleResolver(extensions) : _resolveModuleSync;
  const resolveWithAlias = alias ? _createSyncModuleResolver(extensions, alias) : undefined;

  function toSourcePath(resolvedFileName: string): string {
    if (!hasCustomExts || !customCompilerExtensionsSet.has(extname(resolvedFileName))) {
      return toSourceFilePath(resolvedFileName) || resolvedFileName;
    }
    return resolvedFileName;
  }

  function toResult(resolvedFileName: string): ResolvedModule {
    const mapped = toSourcePath(resolvedFileName);
    return {
      resolvedFileName: mapped,
      isExternalLibraryImport: mapped === resolvedFileName && isInNodeModules(resolvedFileName),
    };
  }

  function resolveModuleName(name: string, containingFile: string): ResolvedModule | undefined {
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
      return { resolvedFileName: candidate, isExternalLibraryImport: false };
    }
  }

  function resolveFileName(name: string, containingFile: string): string | undefined {
    const sanitizedSpecifier = sanitizeSpecifier(name);

    if (isBuiltin(sanitizedSpecifier)) return undefined;

    const resolvedFileName = resolveSync(sanitizedSpecifier, containingFile);
    if (resolvedFileName) return toSourcePath(resolvedFileName);

    if (resolveWithAlias) {
      const aliasResolved = resolveWithAlias(sanitizedSpecifier, containingFile);
      if (aliasResolved) return toSourcePath(aliasResolved);
    }

    const candidate = isAbsolute(sanitizedSpecifier)
      ? sanitizedSpecifier
      : join(dirname(containingFile), sanitizedSpecifier);
    if (existsSync(candidate)) return candidate;
  }

  return {
    resolveModuleName: timerify(resolveModuleName),
    resolveFileName: timerify(resolveFileName, 'resolveFileName'),
  };
}
