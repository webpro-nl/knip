import type { ParseResult, Visitor } from 'oxc-parser';
import { extractSpecifiers } from './typescript/follow-imports.ts';
import { _parseFile } from './typescript/ast-nodes.ts';
import { CacheConsultant } from './CacheConsultant.ts';
import { getCompilerExtensions } from './compilers/index.ts';
import type { AsyncCompilers, SyncCompilers } from './compilers/types.ts';
import { DEFAULT_EXTENSIONS } from './constants.ts';
import type {
  GetImportsAndExportsOptions,
  IgnoreExportsUsedInFile,
  PluginVisitorContext,
  PluginVisitorObject,
} from './types/config.ts';
import type { FileNode, ModuleGraph } from './types/module-graph.ts';
import type { Paths } from './types/project.ts';
import { _getImportsAndExports } from './typescript/get-imports-and-exports.ts';
import { createBunShellVisitor } from './typescript/visitors/script-visitors.ts';
import { buildVisitor } from './typescript/visitors/walk.ts';
import { createCustomModuleResolver } from './typescript/resolve-module-names.ts';
import type { ResolveModule } from './typescript/ast-nodes.ts';
import { SourceFileManager } from './typescript/SourceFileManager.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { timerify } from './util/Performance.ts';
import { extname, isInNodeModules, toAbsolute } from './util/path.ts';
import type { ToSourceFilePath, WorkspaceManifestHandler } from './util/to-source-path.ts';

export class ProjectPrincipal {
  entryPaths = new Set<string>();
  projectPaths = new Set<string>();
  programPaths = new Set<string>();
  skipExportsAnalysis = new Set<string>();

  pluginCtx: PluginVisitorContext = {
    filePath: '',
    sourceText: '',
    addScript: () => {},
    addImport: () => {},
    markExportRegistered: () => {},
  };
  pluginVisitorObjects: PluginVisitorObject[] = [];
  private _visitor: Visitor | undefined;
  private _localRefsVisitor: Visitor | undefined;

  syncCompilers: SyncCompilers = new Map();
  asyncCompilers: AsyncCompilers = new Map();
  private paths = new Map<string, Record<string, string[]>>();
  private rootDirs = new Map<string, string[]>();
  private tsConfigFile: string | undefined;
  private extensions = new Set(DEFAULT_EXTENSIONS);

  cache: CacheConsultant<FileNode>;
  toSourceFilePath: ToSourceFilePath;
  private findWorkspaceManifestImports: WorkspaceManifestHandler | undefined;

  fileManager: SourceFileManager;
  private resolveModule: ResolveModule = () => undefined;

  resolvedFiles = new Set<string>();
  deletedFiles = new Set<string>();
  private onPathAdded: ((filePath: string) => void) | undefined;

  constructor(
    options: MainOptions,
    toSourceFilePath: ToSourceFilePath,
    findWorkspaceManifestImports?: WorkspaceManifestHandler
  ) {
    this.cache = new CacheConsultant('root', options);
    this.toSourceFilePath = toSourceFilePath;
    this.findWorkspaceManifestImports = findWorkspaceManifestImports;
    this.tsConfigFile = options.tsConfigFile ? toAbsolute(options.tsConfigFile, options.cwd) : undefined;
    this.pluginVisitorObjects.push(createBunShellVisitor(this.pluginCtx));
    this.fileManager = new SourceFileManager({
      compilers: [this.syncCompilers, this.asyncCompilers],
    });
    this.walkAndAnalyze = timerify(this.walkAndAnalyze.bind(this), 'walkAndAnalyze');
  }

  addCompilers(compilers: [SyncCompilers, AsyncCompilers]) {
    for (const [ext, compiler] of compilers[0]) {
      if (!this.syncCompilers.has(ext)) {
        this.syncCompilers.set(ext, compiler);
        this.extensions.add(ext);
      }
    }
    for (const [ext, compiler] of compilers[1]) {
      if (!this.asyncCompilers.has(ext)) {
        this.asyncCompilers.set(ext, compiler);
        this.extensions.add(ext);
      }
    }
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
    this.extensions = new Set([
      ...DEFAULT_EXTENSIONS,
      ...getCompilerExtensions([this.syncCompilers, this.asyncCompilers]),
    ]);
    const customCompilerExtensions = getCompilerExtensions([this.syncCompilers, this.asyncCompilers]);
    const scopedPaths =
      this.paths.size > 0 ? Array.from(this.paths, ([scope, paths]) => ({ scope, paths })) : undefined;
    const scopedRootDirs =
      this.rootDirs.size > 0 ? Array.from(this.rootDirs, ([scope, rootDirs]) => ({ scope, rootDirs })) : undefined;
    this.resolveModule = createCustomModuleResolver(
      { scopedPaths, scopedRootDirs },
      customCompilerExtensions,
      this.toSourceFilePath,
      this.findWorkspaceManifestImports,
      this.tsConfigFile
    );
  }

  readFile(filePath: string): string {
    return this.fileManager.readFile(filePath);
  }

  private hasAcceptedExtension(filePath: string) {
    return this.extensions.has(extname(filePath));
  }

  addEntryPath(filePath: string, options?: { skipExportsAnalysis: boolean }) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.entryPaths.add(filePath);
      this.projectPaths.add(filePath);
      if (options?.skipExportsAnalysis) this.skipExportsAnalysis.add(filePath);
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
      this.projectPaths.add(filePath);
      this.deletedFiles.delete(filePath);
    }
  }

  removeProjectPath(filePath: string) {
    this.entryPaths.delete(filePath);
    this.projectPaths.delete(filePath);
    this.invalidateFile(filePath);
    this.deletedFiles.add(filePath);
  }

  async runAsyncCompilers() {
    const add = timerify(this.fileManager.compileAndAddSourceFile.bind(this.fileManager));
    const extensions = Array.from(this.asyncCompilers.keys());
    const files = Array.from(this.projectPaths).filter(filePath => extensions.includes(extname(filePath)));
    for (const filePath of files) {
      await add(filePath);
    }
  }

  walkAndAnalyze(
    analyzeFile: (
      filePath: string,
      parseResult: ParseResult | undefined,
      sourceText: string,
      cachedFile?: FileNode
    ) => Iterable<string> | undefined
  ) {
    this.resolvedFiles.clear();
    const visited = new Set([...this.entryPaths, ...this.programPaths]);
    this.onPathAdded = p => visited.add(p);

    try {
      for (const filePath of visited) {
        const isProjectPath = this.projectPaths.has(filePath);

        // Cached project files: skip read+parse and pass the cached FileNode through.
        const cachedFile = isProjectPath ? this.cache.getCachedFile(filePath) : undefined;

        if (cachedFile) {
          const internalPaths = analyzeFile(filePath, undefined, '', cachedFile);
          if (internalPaths) for (const p of internalPaths) visited.add(p);
          continue;
        }

        const sourceText = this.fileManager.readFile(filePath);
        if (!sourceText) {
          if (isProjectPath) analyzeFile(filePath, undefined, '');
          continue;
        }

        try {
          const result = _parseFile(filePath, sourceText);
          this.fileManager.sourceTextCache.delete(filePath);

          if (isProjectPath) {
            const internalPaths = analyzeFile(filePath, result, sourceText);
            if (internalPaths) for (const p of internalPaths) visited.add(p);
          } else {
            for (const specifier of extractSpecifiers(result, sourceText, filePath)) {
              const resolved = this.resolveSpecifier(specifier, filePath);
              if (resolved && !isInNodeModules(resolved)) visited.add(resolved);
            }
          }
        } catch {
          // Parse error — skip this file
        }
      }
    } finally {
      this.onPathAdded = undefined;
    }

    this.resolvedFiles = visited;
  }

  getUsedResolvedFiles() {
    this.resolvedFiles.clear();
    const visited = new Set([...this.entryPaths, ...this.programPaths]);

    for (const filePath of visited) {
      const sourceText = this.fileManager.readFile(filePath);
      if (!sourceText) continue;

      try {
        const result = _parseFile(filePath, sourceText);
        for (const specifier of extractSpecifiers(result, sourceText, filePath)) {
          const resolved = this.resolveSpecifier(specifier, filePath);
          if (resolved && !isInNodeModules(resolved)) visited.add(resolved);
        }
      } catch {
        // Parse error — skip this file
      }
    }

    this.resolvedFiles = visited;
    return Array.from(this.projectPaths).filter(filePath => visited.has(filePath));
  }

  private resolveSpecifier(specifier: string, containingFile: string): string | undefined {
    return this.resolveModule(specifier, containingFile)?.resolvedFileName;
  }

  getUnreferencedFiles() {
    return Array.from(this.projectPaths).filter(filePath => !this.resolvedFiles.has(filePath));
  }

  analyzeSourceFile(
    filePath: string,
    options: GetImportsAndExportsOptions,
    ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
    parseResult?: ParseResult,
    sourceText?: string,
    cachedFile?: FileNode
  ) {
    if (cachedFile) return cachedFile;

    const cached = this.cache.getCachedFile(filePath);
    if (cached) return cached;

    sourceText ??= this.fileManager.readFile(filePath);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    if (options.isFixExports || options.isFixTypes) {
      const ext = extname(filePath);
      if (!DEFAULT_EXTENSIONS.has(ext) && (this.syncCompilers.has(ext) || this.asyncCompilers.has(ext))) {
        options = { ...options, isFixExports: false, isFixTypes: false };
      }
    }

    const visitor = ignoreExportsUsedInFile
      ? (this._localRefsVisitor ??= buildVisitor(this.pluginVisitorObjects, true))
      : (this._visitor ??= buildVisitor(this.pluginVisitorObjects, false));

    return _getImportsAndExports(
      filePath,
      sourceText,
      this.resolveModule,
      options,
      ignoreExportsUsedInFile,
      skipExports,
      visitor,
      this.pluginVisitorObjects.length > 0 ? this.pluginCtx : undefined,
      parseResult
    );
  }

  invalidateFile(filePath: string) {
    this.fileManager.invalidate(filePath);
  }

  reconcileCache(graph: ModuleGraph) {
    for (const [filePath, file] of graph) {
      const fd = this.cache.getFileDescriptor(filePath);
      if (!fd?.meta) continue;
      fd.meta.data = { ...file, internalImportCache: undefined, importedBy: undefined };
    }
    this.cache.reconcile();
  }
}
