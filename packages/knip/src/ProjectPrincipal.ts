import { isBuiltin } from 'node:module';
import type { ParseResult } from 'oxc-parser';
import { native } from './native.ts';
import {
  createNativeFile,
  createNativeOptions,
  nativeGetImportsAndExports,
  nativeGetImportsAndExportsWithResolver,
  type NativeOptions,
  type NativeVisitorId,
} from './native-analyzer.ts';
import type { ConfigurationChief } from './ConfigurationChief.ts';
import {
  NativeModuleResolver,
  createNativeResolverPlan,
  createNativeSourceMappingLogger,
  type NativeFileRequest,
  type NativeResolutionDependencies,
} from './native-module-resolver.ts';
import { GraphCacheConsultant } from './CacheConsultant.ts';
import { NativeProjectGraph } from './native-graph.ts';
import { createNativeResolverCache } from './native-resolver-cache.ts';
import { isSourceOnlyCompiler } from './compilers/index.ts';
import type { Compiler, Compilers } from './compilers/types.ts';
import { DEFAULT_EXTENSIONS, IS_DTS } from './constants.ts';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from './types/config.ts';
import type { FileNode, ModuleGraph } from './types/module-graph.ts';
import type { Paths } from './types/project.ts';
import { createCustomModuleResolver, createGlobAliasResolver } from './typescript/resolve-module-names.ts';
import type { ResolveGlobPattern } from './typescript/resolve-module-names.ts';
import type { ResolveModule } from './typescript/ast-nodes.ts';
import { SourceFileManager } from './typescript/SourceFileManager.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { timerify } from './util/Performance.ts';
import { extname, isInNodeModules, join, toAbsolute } from './util/path.ts';
import type { ToSourceFilePath, WorkspacePackageTargetHandler } from './util/to-source-path.ts';

const getImportsAndExports = timerify(nativeGetImportsAndExports);
const getImportsAndExportsWithResolver = timerify(nativeGetImportsAndExportsWithResolver);

export class ProjectPrincipal {
  entryPaths = new Set<string>();
  projectPaths = new Set<string>();
  programPaths = new Set<string>();
  skipExportsAnalysis = new Set<string>();
  private includeExportsAnalysis = new Set<string>();

  nativeVisitorPlan: NativeVisitorId[] = ['bun-shell'];

  compilers: Compilers = new Map();
  private scopedCompilers = new Map<string, Map<string, Compiler>>();
  private paths = new Map<string, Record<string, string[]>>();
  private rootDirs = new Map<string, string[]>();
  private tsConfigFile: string | undefined;
  private extensions = new Set(DEFAULT_EXTENSIONS);

  cache: GraphCacheConsultant;
  nativeGraph: NativeProjectGraph | undefined;
  toSourceFilePath: ToSourceFilePath;
  private findWorkspacePackageTarget: WorkspacePackageTargetHandler | undefined;
  private findWorkspaceNameByFilePath: (filePath: string) => string | undefined;
  private isReportExports: boolean;

  fileManager: SourceFileManager;
  private resolveModule: ResolveModule = () => undefined;
  private nativeResolver: NativeModuleResolver | undefined;
  private batchEnabled: boolean;
  private getWorkspaceIgnoreExports: (filePath: string) => IgnoreExportsUsedInFile | undefined = () => undefined;
  private configDependencies = new Set<string>();
  private configResolutionDependencies: NativeResolutionDependencies | undefined;
  private configDependencyFingerprint: string | undefined;
  private cacheableCompilers = new Set<Compiler>();
  private isCache: boolean;
  resolveGlobPattern: ResolveGlobPattern = pattern => [pattern];

  resolvedFiles = new Set<string>();
  deletedFiles = new Set<string>();
  private onPathAdded: ((filePath: string) => void) | undefined;

  constructor(
    options: MainOptions,
    toSourceFilePath: ToSourceFilePath,
    findWorkspacePackageTarget: WorkspacePackageTargetHandler | undefined,
    findWorkspaceNameByFilePath: (filePath: string) => string | undefined
  ) {
    this.cache = new GraphCacheConsultant(options);
    this.isCache = options.isCache;
    if (options.configFilePath) this.configDependencies.add(options.configFilePath);
    for (const name of ['bun.lock', 'bun.lockb', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'])
      this.configDependencies.add(join(options.cwd, name));
    if (!options.isSession && !options.isWatch && !options.isTrace && !options.isReportCycles)
      this.nativeGraph = new NativeProjectGraph();
    this.batchEnabled = !options.isWatch && !options.isSession && !options.isDebug;
    this.toSourceFilePath = toSourceFilePath;
    this.findWorkspacePackageTarget = findWorkspacePackageTarget;
    this.findWorkspaceNameByFilePath = findWorkspaceNameByFilePath;
    this.isReportExports = options.isReportExports;
    this.tsConfigFile = options.tsConfigFile ? toAbsolute(options.tsConfigFile, options.cwd) : undefined;
    this.fileManager = new SourceFileManager({
      compilers: this.compilers,
      isSession: options.isSession || options.isWatch,
    });
    this.walkAndAnalyze = timerify(this.walkAndAnalyze.bind(this), 'walkAndAnalyze');
  }

  addCompilers(workspaceName: string, compilers: Compilers) {
    for (const [ext, compiler] of compilers) {
      const workspaceCompilers = this.scopedCompilers.get(ext);
      if (workspaceCompilers) {
        workspaceCompilers.set(workspaceName, compiler);
      } else {
        const workspaceCompilers = new Map([[workspaceName, compiler]]);
        this.scopedCompilers.set(ext, workspaceCompilers);
        this.compilers.set(ext, (source, filePath) => {
          const owner = this.findWorkspaceNameByFilePath(filePath);
          return ((owner ? workspaceCompilers.get(owner) : undefined) ?? compiler)(source, filePath);
        });
        this.extensions.add(ext);
      }
    }
  }

  hasOnlySourceCompilers() {
    for (const scoped of this.scopedCompilers.values()) {
      for (const compiler of scoped.values()) {
        if (!isSourceOnlyCompiler(compiler)) return false;
      }
    }
    return true;
  }

  addPaths(paths: Paths, basePath: string, scope: string) {
    if (!paths) return;
    const scoped = this.paths.get(scope) ?? {};
    for (const key in paths) {
      const prefixes = paths[key].map(prefix => toAbsolute(prefix, basePath));
      scoped[key] = key in scoped ? compact([...scoped[key], ...prefixes]) : prefixes;
    }
    this.paths.set(scope, scoped);
  }

  addRootDirs(rootDirs: string[] | undefined, scope: string) {
    if (!rootDirs?.length) return;
    const scoped = this.rootDirs.get(scope) ?? [];
    this.rootDirs.set(scope, compact([...scoped, ...rootDirs]));
  }

  init() {
    this.nativeResolver = undefined;
    const scopedPaths =
      this.paths.size > 0 ? Array.from(this.paths, ([scope, paths]) => ({ scope, paths })) : undefined;
    const scopedRootDirs =
      this.rootDirs.size > 0 ? Array.from(this.rootDirs, ([scope, rootDirs]) => ({ scope, rootDirs })) : undefined;
    this.resolveModule = createCustomModuleResolver(
      { scopedPaths, scopedRootDirs },
      [...this.compilers.keys()],
      this.toSourceFilePath,
      this.findWorkspacePackageTarget,
      this.tsConfigFile
    );
    this.resolveGlobPattern = createGlobAliasResolver(scopedPaths);
  }

  initNative(
    chief: ConfigurationChief,
    isDebug: boolean,
    analysisOptions: GetImportsAndExportsOptions,
    configFiles: Iterable<string>
  ) {
    for (const filePath of configFiles) this.configDependencies.add(filePath);
    const plan = createNativeResolverPlan(
      chief,
      this.paths,
      this.rootDirs,
      [...this.compilers.keys()],
      this.tsConfigFile
    );
    this.nativeResolver = new NativeModuleResolver(
      plan,
      isDebug ? createNativeSourceMappingLogger(chief.cwd) : undefined
    );
    this.getWorkspaceIgnoreExports = filePath =>
      chief.findWorkspaceByFilePath(filePath)?.config.ignoreExportsUsedInFile;
    if (this.isCache) {
      this.configResolutionDependencies = undefined;
      this.configDependencyFingerprint = undefined;
      let hasCustomCacheKey = false;
      for (const scoped of this.scopedCompilers.values()) {
        for (const compiler of scoped.values()) {
          if (
            !isSourceOnlyCompiler(compiler) &&
            (typeof compiler.cacheKey === 'string' || typeof compiler.cacheKey === 'function')
          )
            hasCustomCacheKey = true;
        }
      }
      const complete =
        hasCustomCacheKey &&
        this.collectConfigDependencies(new NativeModuleResolver(plan, undefined, createNativeResolverCache()));
      const workspaces = [];
      for (const workspace of chief.workspacesByDir.values()) {
        workspaces.push([workspace.dir, workspace.manifestStr, workspace.config.ignoreExportsUsedInFile]);
      }
      const compilers = [];
      this.cacheableCompilers.clear();
      for (const [extension, scoped] of this.scopedCompilers) {
        for (const [workspace, compiler] of scoped) {
          let cacheKey;
          if (isSourceOnlyCompiler(compiler)) {
            cacheKey = 'builtin';
          } else if (complete) {
            try {
              cacheKey = typeof compiler.cacheKey === 'function' ? compiler.cacheKey() : compiler.cacheKey;
            } catch {}
          }
          if (typeof cacheKey === 'string') this.cacheableCompilers.add(compiler);
          compilers.push([extension, workspace, compiler.toString(), cacheKey]);
        }
      }
      this.cache.setContext(
        JSON.stringify({
          plan,
          analysisOptions,
          visitors: this.nativeVisitorPlan,
          workspaces,
          compilers,
          configFiles: Array.from(this.configDependencies).sort(),
          projects: Array.from(this.projectPaths).sort(),
          entries: Array.from(this.entryPaths).sort(),
          programs: Array.from(this.programPaths).sort(),
        }),
        (paths, files) => this.nativeResolver?.resolutionDependencyFingerprint(paths, files)
      );
    }
    this.resolveModule = this.nativeResolver.resolveModule.bind(this.nativeResolver);
    const scopedPaths =
      this.paths.size > 0 ? Array.from(this.paths, ([scope, paths]) => ({ scope, paths })) : undefined;
    this.resolveGlobPattern = createGlobAliasResolver(scopedPaths);
  }

  private hasAcceptedExtension(filePath: string) {
    return this.extensions.has(extname(filePath));
  }

  addEntryPath(filePath: string, options?: { skipExportsAnalysis: boolean }) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.entryPaths.add(filePath);
      this.projectPaths.add(filePath);
      if (options) {
        if (options.skipExportsAnalysis) {
          if (!this.includeExportsAnalysis.has(filePath)) this.skipExportsAnalysis.add(filePath);
        } else {
          this.includeExportsAnalysis.add(filePath);
          this.skipExportsAnalysis.delete(filePath);
        }
      }
      this.onPathAdded?.(filePath);
    }
  }

  addEntryPaths(filePaths: Set<string> | string[], options?: { skipExportsAnalysis: boolean }) {
    for (const filePath of filePaths) this.addEntryPath(filePath, options);
  }

  addProgramPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.programPaths.add(filePath);
      this.onPathAdded?.(filePath);
    }
  }

  addProjectPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      if (!this.projectPaths.has(filePath)) this.cache.invalidate();
      this.projectPaths.add(filePath);
      this.deletedFiles.delete(filePath);
    }
  }

  removeProjectPath(filePath: string) {
    this.cache.invalidate();
    this.entryPaths.delete(filePath);
    this.projectPaths.delete(filePath);
    this.skipExportsAnalysis.delete(filePath);
    this.includeExportsAnalysis.delete(filePath);
    this.invalidateFile(filePath);
    this.deletedFiles.add(filePath);
  }

  async walkAndAnalyze(
    analyzeFile: (
      filePath: string,
      parseResult: ParseResult | undefined,
      sourceText: string,
      cachedFile?: FileNode
    ) => Iterable<string> | undefined,
    options?: GetImportsAndExportsOptions
  ) {
    this.resolvedFiles.clear();
    const visited = new Set([...this.entryPaths, ...this.programPaths]);
    const pending = [...visited];
    const add = (filePath: string) => {
      if (visited.has(filePath)) return;
      visited.add(filePath);
      pending.push(filePath);
    };
    this.onPathAdded = add;

    try {
      let cursor = 0;
      while (cursor < pending.length) {
        const requests: NativeFileRequest[] = [];
        const batch: { filePath: string; cachedFile?: FileNode; options?: NativeOptions; request: number }[] = [];
        while (cursor + batch.length < pending.length && batch.length < 64) {
          const filePath = pending[cursor + batch.length];
          const isProjectPath = this.projectPaths.has(filePath);
          const hasCompiler = this.compilers.has(extname(filePath));
          if (hasCompiler && batch.length > 0) break;
          const cachedFile = isProjectPath ? this.getCachedFile(filePath) : undefined;
          let nativeOptions: NativeOptions | undefined;
          if (
            !cachedFile &&
            options &&
            this.batchEnabled &&
            this.nativeResolver &&
            isProjectPath &&
            DEFAULT_EXTENSIONS.has(extname(filePath)) &&
            !hasCompiler &&
            !this.fileManager.sourceTextCache.has(filePath)
          ) {
            const ignore = this.getWorkspaceIgnoreExports(filePath);
            if (ignore !== undefined)
              nativeOptions = createNativeOptions(
                options,
                ignore,
                this.skipExportsAnalysis.has(filePath),
                this.nativeVisitorPlan
              );
          }
          if (!cachedFile && !nativeOptions && batch.length > 0) break;
          batch.push({ filePath, cachedFile, options: nativeOptions, request: requests.length });
          if (nativeOptions) requests.push({ filePath, options: nativeOptions });
          if (hasCompiler || (!cachedFile && !nativeOptions)) break;
        }
        let results;
        try {
          results = requests.length > 0 ? this.nativeResolver?.analyzeFiles(requests) : undefined;
        } catch {
          results = undefined;
        }
        for (const prepared of batch) {
          const { filePath } = prepared;
          const isProjectPath = this.projectPaths.has(filePath);

          let cachedFile = prepared.cachedFile;
          if (cachedFile?.skipExports !== (this.skipExportsAnalysis.has(filePath) || !this.isReportExports))
            cachedFile = undefined;
          const result = prepared.options && results?.[prepared.request];
          if (
            result?.file &&
            !result.error &&
            !result.unreadable &&
            prepared.options?.skipExportsForFile === this.skipExportsAnalysis.has(filePath)
          ) {
            try {
              const filters: RegExp[] = [];
              for (const [pattern, flags] of result.filters) filters.push(new RegExp(pattern, flags));
              const file = this.cache.setCachedFile(
                filePath,
                createNativeFile(result.file, filters, !this.nativeGraph)
              );
              const internalPaths = analyzeFile(filePath, undefined, '', file);
              if (internalPaths) for (const p of internalPaths) add(p);
            } catch {
              this.cache.removeEntry(filePath);
              continue;
            }
            continue;
          }

          if (cachedFile) {
            const internalPaths = analyzeFile(filePath, undefined, '', cachedFile);
            if (internalPaths) for (const p of internalPaths) add(p);
            continue;
          }

          const loaded = this.fileManager.loadSourceText(filePath);
          const sourceText = typeof loaded === 'string' ? loaded : await loaded;
          if (!sourceText) {
            if (isProjectPath) analyzeFile(filePath, undefined, '');
            continue;
          }

          try {
            this.fileManager.sourceTextCache.delete(filePath);

            if (isProjectPath) {
              const internalPaths = analyzeFile(filePath, undefined, sourceText);
              if (internalPaths) for (const p of internalPaths) add(p);
            } else {
              for (const specifier of native.extractSpecifiers(filePath, sourceText)) {
                const resolved = this.resolveSpecifier(specifier, filePath);
                if (resolved && !isInNodeModules(resolved)) add(resolved);
              }
            }
          } catch {
            this.cache.removeEntry(filePath);
          }
        }
        cursor += batch.length;
      }
    } finally {
      this.onPathAdded = undefined;
    }

    this.resolvedFiles = visited;
  }

  async getUsedResolvedFiles() {
    this.resolvedFiles.clear();
    const visited = new Set([...this.entryPaths, ...this.programPaths]);

    for (const filePath of visited) {
      const loaded = this.fileManager.loadSourceText(filePath);
      const sourceText = typeof loaded === 'string' ? loaded : await loaded;
      if (!sourceText) continue;

      try {
        for (const specifier of native.extractSpecifiers(filePath, sourceText)) {
          const resolved = this.resolveSpecifier(specifier, filePath);
          if (resolved && !isInNodeModules(resolved)) visited.add(resolved);
        }
      } catch {
        // Parse error — skip this file
      }
    }

    this.resolvedFiles = visited;
    const usedFiles = new Set<string>();
    for (const filePath of this.projectPaths) if (visited.has(filePath)) usedFiles.add(filePath);
    return usedFiles;
  }

  private resolveSpecifier(specifier: string, containingFile: string): string | undefined {
    return this.resolveModule(specifier, containingFile)?.resolvedFileName;
  }

  getUnreferencedFiles() {
    return Array.from(this.projectPaths).filter(filePath => !this.resolvedFiles.has(filePath));
  }

  private getCachedFile(filePath: string) {
    if (!this.isCacheableFile(filePath)) return;
    const cachedFile = this.cache.getCachedFile(filePath, !this.nativeGraph);
    const skipExports = this.skipExportsAnalysis.has(filePath) || !this.isReportExports;
    return cachedFile?.skipExports === skipExports ? cachedFile : undefined;
  }

  analyzeSourceFile(
    filePath: string,
    sourceText: string,
    options: GetImportsAndExportsOptions,
    ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
    _parseResult?: ParseResult,
    cachedFile?: FileNode
  ) {
    if (cachedFile) return cachedFile;

    const cached = this.getCachedFile(filePath);
    if (cached) return cached;

    const skipExports = this.skipExportsAnalysis.has(filePath);

    if (options.isFixExports || options.isFixTypes) {
      const ext = extname(filePath);
      if (!DEFAULT_EXTENSIONS.has(ext) && this.compilers.has(ext)) {
        options = { ...options, isFixExports: false, isFixTypes: false };
      }
    }

    const file = this.nativeResolver
      ? getImportsAndExportsWithResolver(
          filePath,
          sourceText,
          this.nativeResolver,
          options,
          ignoreExportsUsedInFile,
          skipExports,
          this.nativeVisitorPlan,
          !this.nativeGraph
        )
      : getImportsAndExports(
          filePath,
          sourceText,
          this.resolveModule,
          options,
          ignoreExportsUsedInFile,
          skipExports,
          this.nativeVisitorPlan
        );
    return this.isCacheableFile(filePath) ? this.cache.setCachedFile(filePath, file) : file;
  }

  invalidateFile(filePath: string) {
    this.fileManager.invalidate(filePath);
    this.cache.removeEntry(filePath);
  }

  reconcileCache(_graph: ModuleGraph) {
    if (!this.isCache) return;
    const dependencies = this.nativeResolver?.resolutionDependencies();
    if (dependencies) {
      if (this.configResolutionDependencies) {
        const snapshot = this.configResolutionDependencies;
        for (const path of snapshot.paths) dependencies.paths.push(path);
        for (const file of snapshot.files) dependencies.files.push(file);
        dependencies.complete &&=
          snapshot.complete &&
          this.configDependencyFingerprint !== undefined &&
          this.nativeResolver?.resolutionDependencyFingerprint(snapshot.paths, snapshot.files) ===
            this.configDependencyFingerprint;
      }
      for (const filePath of this.configDependencies) {
        dependencies.paths.push(filePath);
        dependencies.files.push(filePath);
      }
    }
    this.cache.reconcile(dependencies);
  }

  finishCache(graph: ModuleGraph) {
    if (!this.cache.closeIfUnchanged()) this.reconcileCache(graph);
    this.cache.close();
  }

  private isCacheableFile(filePath: string) {
    if (!this.isCache) return false;
    const scoped = this.scopedCompilers.get(extname(filePath));
    if (!scoped) return true;
    const owner = this.findWorkspaceNameByFilePath(filePath);
    const compiler = (owner ? scoped.get(owner) : undefined) ?? scoped.values().next().value;
    return compiler !== undefined && this.cacheableCompilers.has(compiler);
  }

  collectConfigurationImports(paths: Set<string>, resolver = this.nativeResolver) {
    if (!resolver) return false;
    let complete = true;
    for (const filePath of paths) {
      if (!DEFAULT_EXTENSIONS.has(extname(filePath))) continue;
      if (isInNodeModules(filePath) || IS_DTS.test(filePath)) {
        complete = false;
        continue;
      }
      const source = this.fileManager.readRawFile(filePath);
      if (source === undefined) {
        complete = false;
        continue;
      }
      try {
        for (const specifier of native.extractSpecifiers(filePath, source)) {
          if (isBuiltin(specifier)) continue;
          const resolved = resolver.resolveModule(specifier, filePath);
          if (resolved) paths.add(resolved.resolvedFileName);
          if (!resolved || resolved.isExternalLibraryImport) complete = false;
        }
      } catch {
        complete = false;
      }
    }
    return complete;
  }

  private collectConfigDependencies(resolver: NativeModuleResolver) {
    const complete = this.collectConfigurationImports(this.configDependencies, resolver);
    const dependencies = resolver.resolutionDependencies();
    for (const filePath of this.configDependencies) {
      dependencies.paths.push(filePath);
      dependencies.files.push(filePath);
    }
    this.configResolutionDependencies = dependencies;
    this.configDependencyFingerprint = resolver.resolutionDependencyFingerprint(dependencies.paths, dependencies.files);
    return complete && dependencies.complete && this.configDependencyFingerprint !== undefined;
  }
}
