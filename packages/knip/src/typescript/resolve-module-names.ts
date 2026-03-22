import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { DEFAULT_EXTENSIONS, DTS_EXTENSIONS } from '../constants.ts';
import { sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.ts';
import { _createSyncModuleResolver, _resolveModuleSync, convertPathsToAlias } from '../util/resolve.ts';
import type { ToSourceFilePath } from '../util/to-source-path.ts';
import type { ResolveModule, ResolvedModule } from './visitors/helpers.ts';

export function createCustomModuleResolver(
  compilerOptions: { paths?: Record<string, string[]>; rootDirs?: string[] },
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath
): ResolveModule {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const hasCustomExts = customCompilerExtensionsSet.size > 0;
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions, ...DTS_EXTENSIONS];
  const alias = convertPathsToAlias(compilerOptions.paths as Record<string, string[]>);
  const resolveSync = hasCustomExts ? _createSyncModuleResolver(extensions) : _resolveModuleSync;
  const resolveWithAlias = alias ? _createSyncModuleResolver(extensions, alias) : undefined;
  const rootDirs = compilerOptions.rootDirs;

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

    if (rootDirs && !isAbsolute(sanitizedSpecifier)) {
      const containingDir = dirname(containingFile);
      for (const srcRoot of rootDirs) {
        if (!containingDir.startsWith(srcRoot)) continue;
        const relPath = containingDir.slice(srcRoot.length);
        for (const targetRoot of rootDirs) {
          if (targetRoot === srcRoot) continue;
          const mapped = join(targetRoot, relPath, sanitizedSpecifier);
          const resolved = resolveSync(mapped, containingFile);
          if (resolved) return toResult(resolved);
        }
      }
    }
  }

  return timerify(resolveModuleName);
}
