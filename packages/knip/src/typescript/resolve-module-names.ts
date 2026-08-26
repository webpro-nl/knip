import { existsSync, realpathSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { DEFAULT_EXTENSIONS, DTS_EXTENSIONS, IS_DTS } from '../constants.ts';
import { isFile } from '../util/fs.ts';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier, sanitizeSpecifier } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { dirname, extname, isAbsolute, isInNodeModules, join, toPosix } from '../util/path.ts';
import { _createSyncModuleResolver, _resolveModuleSync } from '../util/resolve.ts';
import type { ToSourceFilePath, WorkspacePackageTargetHandler } from '../util/to-source-path.ts';
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

const invalidSegments = /(^|\\|\/)((\.|%2e)(\.|%2e)?|node_modules)(\\|\/|$)/i;

const expandPackageTarget = (target: string | undefined, patternMatch: string | undefined) => {
  if (!target?.startsWith('./') || invalidSegments.test(target.slice(2))) return;
  if (!target.includes('*')) return target;
  if (patternMatch === undefined || invalidSegments.test(patternMatch)) return;
  return target.replaceAll('*', patternMatch);
};

const toPackagePath = (dir: string, target: string) => {
  const candidate = join(dir, target);
  return candidate.startsWith(`${dir}/`) ? candidate : undefined;
};

function pickExistingPackageTarget(
  value: unknown,
  dir: string,
  patternMatch: string | undefined,
  moduleExtensions: Set<string>
): string | undefined {
  if (typeof value === 'string') {
    const target = expandPackageTarget(value, patternMatch);
    if (!target || IS_DTS.test(target) || !moduleExtensions.has(extname(target))) return;
    const candidate = toPackagePath(dir, target);
    return candidate && isFile(candidate) ? candidate : undefined;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) {
      const target = pickExistingPackageTarget(item, dir, patternMatch, moduleExtensions);
      if (target) return target;
    }
    return;
  }
  for (const [condition, child] of Object.entries(value)) {
    if (condition === 'types') continue;
    const target = pickExistingPackageTarget(child, dir, patternMatch, moduleExtensions);
    if (target) return target;
  }
}

type ScopedPaths = Array<{ scope: string; paths: Record<string, string[]> }>;
type ScopedRootDirs = Array<{ scope: string; rootDirs: string[] }>;

interface PathMapping {
  prefix: string;
  wildcard: boolean;
  values: string[];
  scope: string;
}

const moduleResolutionCaches: Array<Map<string, Map<string, ResolvedModule | undefined>>> = [];
const installedPackageRootCache = new Map<string, string | undefined>();

export function clearModuleResolutionCaches() {
  for (const cache of moduleResolutionCaches) cache.clear();
  installedPackageRootCache.clear();
}

function getInstalledPackageRoot(candidate: string) {
  if (installedPackageRootCache.has(candidate)) return installedPackageRootCache.get(candidate);
  let packageRoot: string | undefined;
  try {
    packageRoot = toPosix(realpathSync(candidate));
  } catch {}
  installedPackageRootCache.set(candidate, packageRoot);
  return packageRoot;
}

function getAttributedPackageName(specifier: string, containingFile: string, resolvedFileName: string) {
  const packageName = getPackageNameFromFilePath(resolvedFileName);
  const specifierPackageName = getPackageNameFromModuleSpecifier(specifier);
  if (!specifierPackageName || specifierPackageName === packageName) return packageName;
  let dir = dirname(containingFile);
  while (true) {
    const packageRoot = getInstalledPackageRoot(join(dir, 'node_modules', specifierPackageName));
    if (packageRoot) {
      const isResolvedInstall = resolvedFileName === packageRoot || resolvedFileName.startsWith(`${packageRoot}/`);
      return isResolvedInstall ? specifierPackageName : packageName;
    }
    const parent = dirname(dir);
    if (parent === dir) return packageName;
    dir = parent;
  }
}

function compilePathMappings(scopedPaths: ScopedPaths | undefined): PathMapping[] | undefined {
  if (!scopedPaths) return undefined;
  const mappings: PathMapping[] = [];
  for (const { scope, paths } of scopedPaths) {
    for (const key in paths) {
      const starIndex = key.indexOf('*');
      if (starIndex >= 0) {
        mappings.push({ prefix: key.slice(0, starIndex), wildcard: true, values: paths[key], scope });
      } else {
        mappings.push({ prefix: key, wildcard: false, values: paths[key], scope });
      }
    }
  }
  if (mappings.length === 0) return undefined;
  mappings.sort((a, b) => b.scope.length - a.scope.length);
  return mappings;
}

function compileRootDirs(scopedRootDirs: ScopedRootDirs | undefined): ScopedRootDirs | undefined {
  if (!scopedRootDirs) return undefined;
  const scoped = scopedRootDirs.filter(({ rootDirs }) => rootDirs.length > 1);
  if (scoped.length === 0) return undefined;
  scoped.sort((a, b) => b.scope.length - a.scope.length);
  return scoped;
}

export type ResolveGlobPattern = (pattern: string, dir: string) => string[];

export function createGlobAliasResolver(scopedPaths: ScopedPaths | undefined): ResolveGlobPattern {
  const mappings = compilePathMappings(scopedPaths);
  return (pattern, dir) => {
    if (!mappings) return [pattern];
    const isNegated = pattern[0] === '!';
    const specifier = isNegated ? pattern.slice(1) : pattern;
    let best: PathMapping | undefined;
    for (const mapping of mappings) {
      const { prefix, wildcard, scope } = mapping;
      if (dir !== scope && !dir.startsWith(`${scope}/`)) continue;
      const matches = wildcard
        ? specifier.startsWith(prefix)
        : specifier === prefix || specifier.startsWith(`${prefix}/`);
      if (!matches) continue;
      if (
        !best ||
        scope.length > best.scope.length ||
        (scope.length === best.scope.length && prefix.length > best.prefix.length)
      )
        best = mapping;
    }
    if (!best) return [pattern];
    const captured = specifier.slice(best.prefix.length);
    const resolved: string[] = [];
    for (const value of best.values) {
      const starIdx = value.indexOf('*');
      const mapped = toPosix(
        starIdx >= 0 ? value.slice(0, starIdx) + captured + value.slice(starIdx + 1) : value + captured
      );
      resolved.push(isNegated ? `!${mapped}` : mapped);
    }
    return resolved;
  };
}

export function createCustomModuleResolver(
  compilerOptions: { scopedPaths?: ScopedPaths; scopedRootDirs?: ScopedRootDirs },
  customCompilerExtensions: string[],
  toSourceFilePath: ToSourceFilePath,
  findWorkspacePackageTarget?: WorkspacePackageTargetHandler,
  tsConfigFile?: string
): ResolveModule {
  const customCompilerExtensionsSet = new Set(customCompilerExtensions);
  const moduleExtensions = new Set([...DEFAULT_EXTENSIONS, ...customCompilerExtensions, '.json', '.jsonc']);
  const hasCustomExts = customCompilerExtensionsSet.size > 0;
  const extensions = [...DEFAULT_EXTENSIONS, ...customCompilerExtensions, ...DTS_EXTENSIONS, '.json', '.jsonc'];
  const resolveSync =
    hasCustomExts || tsConfigFile ? _createSyncModuleResolver(extensions, tsConfigFile) : _resolveModuleSync;
  const pathMappings = compilePathMappings(compilerOptions.scopedPaths);
  const rootDirMappings = compileRootDirs(compilerOptions.scopedRootDirs);

  function toSourcePath(resolvedFileName: string): string {
    if (!hasCustomExts || !customCompilerExtensionsSet.has(extname(resolvedFileName))) {
      return toSourceFilePath(resolvedFileName) || resolvedFileName;
    }
    return resolvedFileName;
  }

  function toResult(specifier: string, containingFile: string, resolvedFileName: string): ResolvedModule {
    const mapped = toSourcePath(resolvedFileName);
    const isExternalLibraryImport = mapped === resolvedFileName && isInNodeModules(resolvedFileName);
    return {
      resolvedFileName: mapped,
      isExternalLibraryImport,
      packageName: isExternalLibraryImport
        ? getAttributedPackageName(specifier, containingFile, resolvedFileName)
        : undefined,
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
    if (resolvedFileName) return toResult(specifier, containingFile, resolvedFileName);

    // Fallback for knip.json#paths not in tsconfig.json#compilerOptions.paths, scoped per workspace
    if (pathMappings) {
      const dir = dirname(containingFile);
      for (const { prefix, wildcard, values, scope } of pathMappings) {
        if (dir !== scope && !dir.startsWith(`${scope}/`)) continue;
        if (wildcard ? specifier.startsWith(prefix) : specifier === prefix) {
          const captured = wildcard ? specifier.slice(prefix.length) : '';
          for (const value of values) {
            const starIdx = value.indexOf('*');
            const mapped = starIdx >= 0 ? value.slice(0, starIdx) + captured + value.slice(starIdx + 1) : value;
            const resolved = resolveSync(mapped, containingFile);
            if (resolved) return toResult(specifier, containingFile, resolved);
          }
        }
      }
    }

    // Fallback for tsconfig#compilerOptions.rootDirs (e.g. SvelteKit `$types`), scoped per workspace.
    // oxc-resolver doesn't apply a nested tsconfig's rootDirs when an ancestor tsconfig.json exists.
    if (rootDirMappings && !isAbsolute(specifier)) {
      const dir = dirname(containingFile);
      for (const { scope, rootDirs } of rootDirMappings) {
        if (dir !== scope && !dir.startsWith(`${scope}/`)) continue;
        for (const rootDir of rootDirs) {
          if (dir !== rootDir && !dir.startsWith(`${rootDir}/`)) continue;
          const relPath = dir === rootDir ? '' : dir.slice(rootDir.length + 1);
          for (const targetRoot of rootDirs) {
            if (targetRoot === rootDir) continue;
            const resolved = resolveSync(join(targetRoot, relPath, specifier), containingFile);
            if (resolved) return toResult(specifier, containingFile, resolved);
          }
        }
      }
    }

    const workspaceTarget = findWorkspacePackageTarget?.(specifier, containingFile);
    if (workspaceTarget) {
      const target = expandPackageTarget(pickStringTarget(workspaceTarget.target), workspaceTarget.patternMatch);
      if (target) {
        const targetPath = toPackagePath(workspaceTarget.dir, target);
        const sourcePath = targetPath && toSourceFilePath(targetPath);
        if (sourcePath) return toResult(specifier, containingFile, sourcePath);
      }

      const existingTarget = pickExistingPackageTarget(
        workspaceTarget.target,
        workspaceTarget.dir,
        workspaceTarget.patternMatch,
        moduleExtensions
      );
      if (existingTarget) return toResult(specifier, containingFile, existingTarget);
    }

    const candidate = isAbsolute(specifier) ? specifier : join(dirname(containingFile), specifier);
    if (existsSync(candidate)) {
      return { resolvedFileName: candidate, isExternalLibraryImport: false };
    }
  }

  return timerify(resolveModuleName);
}
