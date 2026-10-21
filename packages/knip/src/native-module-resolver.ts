import { builtinModules, createRequire, isBuiltin } from 'node:module';
import type { ConfigurationChief, Workspace } from './ConfigurationChief.ts';
import type { NativeOptions } from './native-analyzer.ts';
import type { NativeFileCompact } from './native-analyzer-wire.ts';
import { isYarnPnp, nativeResolverCache, type NativeResolverCache } from './native-resolver-cache.ts';
import type { ResolvedModule } from './typescript/ast-nodes.ts';
import { debugLog } from './util/debug.ts';
import { isStartsLikePackageName, sanitizeSpecifier } from './util/modules.ts';
import { toRelative } from './util/path.ts';

interface PackageTarget {
  kind: number;
  text?: string;
  keys: string[];
  children: PackageTarget[];
}
interface ResolverWorkspace {
  dir: string;
  sourceMaps: { srcDir: string; outDir: string }[];
  imports: PackageTarget;
  exports: PackageTarget;
}
export interface NativeResolverPlan {
  customCompilerExtensions: string[];
  tsConfigFile?: string;
  scopedPaths: { scope: string; paths: { name: string; values: string[] }[] }[];
  scopedRootDirs: { scope: string; rootDirs: string[] }[];
  availableWorkspaceDirs: string[];
  workspaces: ResolverWorkspace[];
  workspaceByPackageName: { name: string; index: number }[];
  builtinSpecifiers: string[];
  yarnPnp: boolean;
}
interface NativeResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport: boolean;
  hasPackageName: boolean;
  packageName?: string;
  packageJson?: string;
}
export interface NativeFileRequest {
  filePath: string;
  options: NativeOptions;
}
export interface NativeBatchFile {
  file?: NativeFileCompact;
  filters: [string, string][];
  unreadable?: boolean;
  error?: string;
}
export interface NativeResolutionDependencies {
  paths: string[];
  files: string[];
  complete: boolean;
}
interface ResolverBinding {
  resolveModule(specifier: string, containingFile: string): NativeResolvedModule | null;
  analyzeFile(
    filePath: string,
    sourceText: string,
    options: NativeOptions,
    validateRegExp: (pattern: string, flags: string) => void
  ): NativeFileCompact;
  analyzeFiles(requests: NativeFileRequest[]): NativeBatchFile[];
  resolutionDependencies(): NativeResolutionDependencies;
  resolutionDependencyFingerprint(paths: string[], files?: string[]): string | null;
}
interface Binding {
  NativeModuleResolver: new (
    plan: NativeResolverPlan,
    cache: NativeResolverCache,
    invalidPackageValue: (raw: string, name: boolean) => void,
    sourceMapping?: (from: string, to: string) => void
  ) => ResolverBinding;
}
const require = createRequire(import.meta.url);
const binding: Binding = require('knip/native');
const builtinCandidates = new Set([
  ...builtinModules,
  'bun:wrap',
  'bun:main',
  'node:test',
  'node:test/reporters',
  'node:sea',
  'node:quic',
]);
for (const name of [...builtinCandidates]) builtinCandidates.add(`node:${name}`);
const builtinSpecifiers: string[] = [];
for (const name of builtinCandidates) if (isBuiltin(name)) builtinSpecifiers.push(name);

function encodePackageTarget(value: unknown): PackageTarget {
  const result: PackageTarget = { kind: 0, keys: [], children: [] };
  if (typeof value === 'string') {
    result.kind = 1;
    result.text = value;
  } else if (Array.isArray(value)) {
    result.kind = 2;
    for (const item of value) result.children.push(encodePackageTarget(item));
  } else if (value && typeof value === 'object') {
    result.kind = 3;
    for (const [key, child] of Object.entries(value)) {
      result.keys.push(key);
      result.children.push(encodePackageTarget(child));
    }
  }
  return result;
}

export function createNativeResolverPlan(
  chief: ConfigurationChief,
  paths: Map<string, Record<string, string[]>>,
  rootDirs: Map<string, string[]>,
  customCompilerExtensions: string[],
  tsConfigFile?: string
): NativeResolverPlan {
  const workspaces: ResolverWorkspace[] = [];
  const indices = new Map<Workspace, number>();
  for (const workspace of chief.workspacesByDir.values()) {
    const manifest = chief.workspacePackages.get(workspace.name)?.manifest;
    indices.set(workspace, workspaces.length);
    workspaces.push({
      dir: workspace.dir,
      sourceMaps: workspace.sourceMaps ?? [],
      imports: encodePackageTarget(manifest?.imports),
      exports: encodePackageTarget(manifest?.exports),
    });
  }
  const workspaceByPackageName: NativeResolverPlan['workspaceByPackageName'] = [];
  for (const [name, workspace] of chief.workspacesByPkgName) {
    const index = indices.get(workspace);
    if (index !== undefined) workspaceByPackageName.push({ name, index });
  }
  const scopedPaths: NativeResolverPlan['scopedPaths'] = [];
  for (const [scope, entries] of paths) {
    const values: NativeResolverPlan['scopedPaths'][number]['paths'] = [];
    for (const [name, targets] of Object.entries(entries)) values.push({ name, values: targets });
    scopedPaths.push({ scope, paths: values });
  }
  const scopedRootDirs: NativeResolverPlan['scopedRootDirs'] = [];
  for (const [scope, dirs] of rootDirs) scopedRootDirs.push({ scope, rootDirs: dirs });
  return {
    customCompilerExtensions,
    tsConfigFile,
    scopedPaths,
    scopedRootDirs,
    availableWorkspaceDirs: chief.availableWorkspaceDirs,
    workspaces,
    workspaceByPackageName,
    builtinSpecifiers,
    yarnPnp: isYarnPnp(),
  };
}

interface CallbackErrorState {
  threw: boolean;
  value: unknown;
}

function createResolverCallbacks(state: CallbackErrorState, sourceMapping?: (from: string, to: string) => void) {
  const fail = (error: unknown): never => {
    if (!state.threw) {
      state.threw = true;
      state.value = error;
    }
    throw error instanceof Error ? error : new Error('Module resolution failed');
  };
  return {
    invalidPackageValue(raw: string, name: boolean) {
      try {
        const value = JSON.parse(raw);
        if (name) isStartsLikePackageName(value);
        else sanitizeSpecifier(value);
        throw new Error('Invalid package metadata handler did not throw');
      } catch (error) {
        fail(error);
      }
    },
    sourceMapping:
      sourceMapping &&
      ((from: string, to: string) => {
        try {
          sourceMapping(from, to);
        } catch (error) {
          fail(error);
        }
      }),
  };
}

export class NativeModuleResolver {
  private resolver: ResolverBinding;
  private callbackError: CallbackErrorState = { threw: false, value: undefined };

  constructor(
    plan: NativeResolverPlan,
    sourceMapping?: (from: string, to: string) => void,
    cache: NativeResolverCache = nativeResolverCache
  ) {
    const callbacks = createResolverCallbacks(this.callbackError, sourceMapping);
    this.resolver = new binding.NativeModuleResolver(
      plan,
      cache,
      callbacks.invalidPackageValue,
      callbacks.sourceMapping
    );
  }

  private rethrow(error: unknown): never {
    if (this.callbackError.threw) {
      const original = this.callbackError.value;
      this.callbackError.threw = false;
      this.callbackError.value = undefined;
      throw original;
    }
    throw error;
  }

  resolveModule(specifier: string, containingFile: string): ResolvedModule | undefined {
    let module: NativeResolvedModule | null;
    try {
      module = this.resolver.resolveModule(specifier, containingFile);
    } catch (error) {
      this.rethrow(error);
    }
    if (!module) return;
    const result: ResolvedModule = {
      resolvedFileName: module.resolvedFileName,
      isExternalLibraryImport: module.isExternalLibraryImport,
    };
    if (module.hasPackageName)
      result.packageName =
        module.packageJson == null ? (module.packageName ?? undefined) : JSON.parse(module.packageJson);
    return result;
  }

  analyzeFile(
    filePath: string,
    sourceText: string,
    options: NativeOptions,
    validateRegExp: (pattern: string, flags: string) => void
  ) {
    try {
      return this.resolver.analyzeFile(filePath, sourceText, options, validateRegExp);
    } catch (error) {
      this.rethrow(error);
    }
  }

  analyzeFiles(requests: NativeFileRequest[]) {
    try {
      return this.resolver.analyzeFiles(requests);
    } catch (error) {
      this.rethrow(error);
    }
  }

  resolutionDependencies() {
    return this.resolver.resolutionDependencies();
  }

  resolutionDependencyFingerprint(paths: string[], files: string[] = []) {
    return this.resolver.resolutionDependencyFingerprint(paths, files) ?? undefined;
  }
}

export const createNativeSourceMappingLogger = (cwd: string) => (from: string, to: string) =>
  debugLog('*', `Source mapping ${toRelative(from, cwd)} → ${toRelative(to, cwd)}`);
