import { existsSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { DEFAULT_EXTENSIONS, DTS_EXTENSIONS } from '../constants.ts';
import { sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join } from '../util/path.ts';
import { _createSyncModuleResolver, _resolveModuleSync } from '../util/resolve.ts';
import type { ToSourceFilePath, WorkspaceManifestHandler } from '../util/to-source-path.ts';
import type { ResolveModule, ResolvedModule } from './ast-nodes.ts';

function pickStringTarget(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const obj = value as Record<string, unknown>;
  for (const key of ['default', 'node', 'import', 'require']) {
    const v = pickStringTarget(obj[key]);
    if (v) return v;
  }
  for (const v of Object.values(obj)) {
    const s = pickStringTarget(v);
    if (s) return s;
  }
}

interface PathMapping {
  prefix: string;
  wildcard: boolean;
  values: string[];
}

const moduleResolutionCaches: Array<Map<string, Map<string, ResolvedModule | undefined>>> = [];

export function clearModuleResolutionCaches() {
  for (const cache of moduleResolutionCaches) cache.clear();
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
  compilerOptions: { paths?: Record<string, string[]> },
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath,
  findWorkspaceManifestImports?: WorkspaceManifestHandler
): ResolveModule {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const hasCustomExts = customCompilerExtensionsSet.size > 0;
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions, ...DTS_EXTENSIONS];
  const resolveSync = hasCustomExts ? _createSyncModuleResolver(extensions) : _resolveModuleSync;
  const pathMappings = compilePathMappings(compilerOptions.paths as Record<string, string[]>);

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

  const cache = new Map<string, Map<string, ResolvedModule | undefined>>();
  moduleResolutionCaches.push(cache);

  function resolveModuleName(name: string, containingFile: string): ResolvedModule | undefined {
    const dir = dirname(containingFile);
    let byName = cache.get(dir);
    if (byName) {
      if (byName.has(name)) return byName.get(name);
    } else {
      byName = new Map();
      cache.set(dir, byName);
    }
    const result = resolveModuleNameUncached(name, containingFile);
    byName.set(name, result);
    return result;
  }

  function resolveModuleNameUncached(name: string, containingFile: string): ResolvedModule | undefined {
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

    // Fallback for `#`-imports whose package.json target points to a build artifact:
    // try the source-mapped equivalent so users don't have to pre-build or list it in `ignoreUnresolved`.
    if (specifier.startsWith('#') && findWorkspaceManifestImports) {
      const ws = findWorkspaceManifestImports(containingFile);
      if (ws) {
        const target = pickStringTarget((ws.imports as Record<string, unknown>)[specifier]);
        if (target?.startsWith('.')) {
          const sourcePath = toSourceFilePath(join(ws.dir, target));
          if (sourcePath) return toResult(sourcePath);
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
