import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { DEFAULT_EXTENSIONS, DTS_EXTENSIONS } from '../constants.ts';
import { sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.ts';
import { _createSyncModuleResolver, _resolveModuleSync } from '../util/resolve.ts';
import type { ToSourceFilePath } from '../util/to-source-path.ts';
import type { ResolveModule, ResolvedModule } from './visitors/helpers.ts';

interface PathMapping {
  prefix: string;
  wildcard: boolean;
  values: string[];
}

function compilePathMappings(paths: Record<string, string[]> | undefined): PathMapping[] | undefined {
  if (!paths) return undefined;
  const mappings: PathMapping[] = [];
  for (const key in paths) {
    const starIdx = key.indexOf('*');
    if (starIdx >= 0) {
      mappings.push({ prefix: key.slice(0, starIdx), wildcard: true, values: paths[key] });
    } else {
      mappings.push({ prefix: key, wildcard: false, values: paths[key] });
    }
  }
  return mappings.length > 0 ? mappings : undefined;
}

export function createCustomModuleResolver(
  compilerOptions: { paths?: Record<string, string[]>; rootDirs?: string[] },
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath
): ResolveModule {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const hasCustomExts = customCompilerExtensionsSet.size > 0;
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions, ...DTS_EXTENSIONS];
  const resolveSync = hasCustomExts ? _createSyncModuleResolver(extensions) : _resolveModuleSync;
  const pathMappings = compilePathMappings(compilerOptions.paths as Record<string, string[]>);
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
    const specifier = sanitizeSpecifier(name);

    if (isBuiltin(specifier)) return undefined;

    const resolvedFileName = resolveSync(specifier, containingFile);
    if (resolvedFileName) return toResult(resolvedFileName);

    // Fallback for knip.json#paths not in tsconfig.json#compilerOptions.paths
    if (pathMappings) {
      for (const { prefix, wildcard, values } of pathMappings) {
        if (wildcard ? specifier.startsWith(prefix) : specifier === prefix) {
          const captured = wildcard ? specifier.slice(prefix.length) : '';
          for (const value of values) {
            const starIdx = value.indexOf('*');
            const mapped = starIdx >= 0 ? value.slice(0, starIdx) + captured + value.slice(starIdx + 1) : value;
            const resolved = resolveSync(mapped, containingFile);
            if (resolved) return toResult(resolved);
          }
        }
      }
    }

    // Fallback for https://github.com/oxc-project/oxc-resolver/issues/1075
    if (rootDirs && !isAbsolute(specifier)) {
      const containingDir = dirname(containingFile);
      for (const srcRoot of rootDirs) {
        if (!containingDir.startsWith(srcRoot)) continue;
        const relPath = containingDir.slice(srcRoot.length);
        for (const targetRoot of rootDirs) {
          if (targetRoot === srcRoot) continue;
          const mapped = join(targetRoot, relPath, specifier);
          const resolved = resolveSync(mapped, containingFile);
          if (resolved) return toResult(resolved);
        }
      }
    }

    const candidate = isAbsolute(specifier) ? specifier : join(dirname(containingFile), specifier);
    if (existsSync(candidate)) {
      return { resolvedFileName: candidate, isExternalLibraryImport: false };
    }
  }

  return timerify(resolveModuleName);
}
