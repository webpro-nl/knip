import type { ParseResult, Visitor } from 'oxc-parser';
import { extractSpecifiers } from './typescript/follow-imports.ts';
import { _parseFile } from './typescript/ast-nodes.ts';
import { CacheConsultant } from './CacheConsultant.ts';
import type { Compiler, Compilers } from './compilers/types.ts';
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
import { createCustomModuleResolver, createGlobAliasResolver } from './typescript/resolve-module-names.ts';
import type { ResolveGlobPattern } from './typescript/resolve-module-names.ts';
import type { ResolveModule } from './typescript/ast-nodes.ts';
import { SourceFileManager } from './typescript/SourceFileManager.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { timerify } from './util/Performance.ts';
import { extname, isInNodeModules, toAbsolute } from './util/path.ts';
import type { ToSourceFilePath, WorkspacePackageTargetHandler } from './util/to-source-path.ts';

export class ProjectPrincipal {
  entryPaths = new Set<string>();
  projectPaths = new Set<string>();
  programPaths = new Set<string>();
  skipExportsAnalysis = new Set<string>();
  private includeExportsAnalysis = new Set<string>();

  pluginCtx: PluginVisitorContext = {
    filePath: '',
    sourceText: '',
    addScript: () => {},
    addImport: () => {},
    markImportExpressionHandled: () => {},
    addImportGlob: () => {},
    markExportRegistered: () => {},
  };
  pluginVisitorObjects: PluginVisitorObject[] = [];
  private _visitor: Visitor | undefined;
  private _localRefsVisitor: Visitor | undefined;

  compilers: Compilers = new Map();
  private scopedCompilers = new Map<string, Map<string, Compiler>>();
  private paths = new Map<string, Record<string, string[]>>();
  private rootDirs = new Map<string, string[]>();
  private tsConfigFile: string | undefined;
  private extensions = new Set(DEFAULT_EXTENSIONS);

  cache: CacheConsultant<FileNode>;
  toSourceFilePath: ToSourceFilePath;
  private findWorkspacePackageTarget: WorkspacePackageTargetHandler | undefined;
  private findWorkspaceNameByFilePath: (filePath: string) => string | undefined;
  private isReportExports: boolean;

  fileManager: SourceFileManager;
  private resolveModule: ResolveModule = () => undefined;
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
    this.cache = new CacheConsultant('root', options);
    this.toSourceFilePath = toSourceFilePath;
    this.findWorkspacePackageTarget = findWorkspacePackageTarget;
    this.findWorkspaceNameByFilePath = findWorkspaceNameByFilePath;
    this.isReportExports = options.isReportExports;
    this.tsConfigFile = options.tsConfigFile ? toAbsolute(options.tsConfigFile, options.cwd) : undefined;
    this.pluginVisitorObjects.push(createBunShellVisitor(this.pluginCtx));
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
      this.projectPaths.add(filePath);
      this.deletedFiles.delete(filePath);
    }
  }

  removeProjectPath(filePath: string) {
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
    ) => Iterable<string> | undefined
  ) {
    this.resolvedFiles.clear();
    const visited = new Set([...this.entryPaths, ...this.programPaths]);
    this.onPathAdded = p => visited.add(p);

    try {
      for (const filePath of visited) {
        const isProjectPath = this.projectPaths.has(filePath);

        // Cached project files: skip read+parse and pass the cached FileNode through.
        const cachedFile = isProjectPath ? this.getCachedFile(filePath) : undefined;

        if (cachedFile) {
          const internalPaths = analyzeFile(filePath, undefined, '', cachedFile);
          if (internalPaths) for (const p of internalPaths) visited.add(p);
          continue;
        }

        const loaded = this.fileManager.loadSourceText(filePath);
        const sourceText = typeof loaded === 'string' ? loaded : await loaded;
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

  async getUsedResolvedFiles() {
    this.resolvedFiles.clear();
    const visited = new Set([...this.entryPaths, ...this.programPaths]);

    for (const filePath of visited) {
      const loaded = this.fileManager.loadSourceText(filePath);
      const sourceText = typeof loaded === 'string' ? loaded : await loaded;
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
    const cachedFile = this.cache.getCachedFile(filePath);
    const skipExports = this.skipExportsAnalysis.has(filePath) || !this.isReportExports;
    return cachedFile?.skipExports === skipExports ? cachedFile : undefined;
  }

  analyzeSourceFile(
    filePath: string,
    sourceText: string,
    options: GetImportsAndExportsOptions,
    ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
    parseResult?: ParseResult,
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
    this.cache.removeEntry(filePath);
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
