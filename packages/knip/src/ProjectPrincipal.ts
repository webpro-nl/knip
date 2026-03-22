import type { ParseResult, Visitor } from 'oxc-parser';
import { extractSpecifiers } from './typescript/follow-imports.ts';
import { parseFile } from './typescript/visitors/helpers.ts';
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
import type { ResolveModule } from './typescript/visitors/helpers.ts';
import { SourceFileManager } from './typescript/SourceFileManager.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { timerify } from './util/Performance.ts';
import { extname, isInNodeModules, toAbsolute } from './util/path.ts';
import type { ToSourceFilePath } from './util/to-source-path.ts';

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
  };
  pluginVisitorObjects: PluginVisitorObject[] = [];
  private _visitor: Visitor | undefined;

  syncCompilers: SyncCompilers = new Map();
  asyncCompilers: AsyncCompilers = new Map();
  private paths: Record<string, string[]> = {};
  private rootDirs: string[] = [];
  private extensions = new Set(DEFAULT_EXTENSIONS);

  cache: CacheConsultant<FileNode>;
  toSourceFilePath: ToSourceFilePath;

  fileManager: SourceFileManager;
  private resolveModule: ResolveModule = () => undefined;

  resolvedFiles = new Set<string>();
  deletedFiles = new Set<string>();

  constructor(options: MainOptions, toSourceFilePath: ToSourceFilePath) {
    this.cache = new CacheConsultant('root', options);
    this.toSourceFilePath = toSourceFilePath;
    this.pluginVisitorObjects.push(createBunShellVisitor(this.pluginCtx));
    this.fileManager = new SourceFileManager({
      compilers: [this.syncCompilers, this.asyncCompilers],
    });
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

  addPaths(paths: Paths, basePath: string) {
    if (!paths) return;
    for (const key in paths) {
      const prefixes = paths[key].map(prefix => toAbsolute(prefix, basePath));
      if (key in this.paths) {
        this.paths[key] = compact([...this.paths[key], ...prefixes]);
      } else {
        this.paths[key] = prefixes;
      }
    }
  }

  addRootDirs(rootDirs: string[]) {
    for (const dir of rootDirs) {
      if (!this.rootDirs.includes(dir)) this.rootDirs.push(dir);
    }
  }

  init() {
    this.extensions = new Set([
      ...DEFAULT_EXTENSIONS,
      ...getCompilerExtensions([this.syncCompilers, this.asyncCompilers]),
    ]);
    const customCompilerExtensions = getCompilerExtensions([this.syncCompilers, this.asyncCompilers]);
    const pathsOrUndefined = Object.keys(this.paths).length > 0 ? this.paths : undefined;
    const rootDirsOrUndefined = this.rootDirs.length > 1 ? this.rootDirs : undefined;
    this.resolveModule = createCustomModuleResolver(
      { paths: pathsOrUndefined, rootDirs: rootDirsOrUndefined },
      customCompilerExtensions,
      this.toSourceFilePath
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
    }
  }

  addEntryPaths(filePaths: Set<string> | string[], options?: { skipExportsAnalysis: boolean }) {
    for (const filePath of filePaths) this.addEntryPath(filePath, options);
  }

  addProgramPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.programPaths.add(filePath);
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
      sourceText: string
    ) => Iterable<string> | undefined
  ) {
    this.resolvedFiles.clear();
    const queue = [...this.entryPaths, ...this.programPaths];
    const visited = new Set<string>();
    let lastEntrySize = this.entryPaths.size;
    let lastProgramSize = this.programPaths.size;

    for (let i = 0; i < queue.length; i++) {
      const filePath = queue[i];
      if (visited.has(filePath)) continue;
      visited.add(filePath);

      const sourceText = this.fileManager.readFile(filePath);

      if (!sourceText) {
        if (this.projectPaths.has(filePath)) analyzeFile(filePath, undefined, '');
        continue;
      }

      try {
        const result = parseFile(filePath, sourceText);

        this.fileManager.sourceTextCache.delete(filePath);

        if (this.projectPaths.has(filePath)) {
          const internalPaths = analyzeFile(filePath, result, sourceText);
          if (internalPaths) {
            for (const p of internalPaths) {
              if (!visited.has(p)) queue.push(p);
            }
          }
        } else {
          for (const specifier of extractSpecifiers(result, sourceText, filePath)) {
            const resolved = this.resolveSpecifier(specifier, filePath);
            if (resolved && !isInNodeModules(resolved) && !visited.has(resolved)) {
              queue.push(resolved);
            }
          }
        }

        if (this.entryPaths.size > lastEntrySize || this.programPaths.size > lastProgramSize) {
          for (const p of this.entryPaths) {
            if (!visited.has(p)) queue.push(p);
          }
          for (const p of this.programPaths) {
            if (!visited.has(p)) queue.push(p);
          }
          lastEntrySize = this.entryPaths.size;
          lastProgramSize = this.programPaths.size;
        }
      } catch {
        // Parse error — skip this file
      }
    }

    this.resolvedFiles = visited;
  }

  getUsedResolvedFiles() {
    this.resolvedFiles.clear();
    const queue = [...this.entryPaths, ...this.programPaths];
    const visited = new Set<string>();

    for (let i = 0; i < queue.length; i++) {
      const filePath = queue[i];
      if (visited.has(filePath)) continue;
      visited.add(filePath);

      const sourceText = this.fileManager.readFile(filePath);
      if (!sourceText) continue;

      try {
        const result = parseFile(filePath, sourceText);
        for (const specifier of extractSpecifiers(result, sourceText, filePath)) {
          const resolved = this.resolveSpecifier(specifier, filePath);
          if (resolved && !isInNodeModules(resolved) && !visited.has(resolved)) {
            queue.push(resolved);
          }
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
    sourceText?: string
  ) {
    const fd = this.cache.getFileDescriptor(filePath);
    if (!fd.changed && fd.meta?.data) return fd.meta.data;

    sourceText ??= this.fileManager.readFile(filePath);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    if (options.isFixExports || options.isFixTypes) {
      const ext = extname(filePath);
      if (!DEFAULT_EXTENSIONS.has(ext) && (this.syncCompilers.has(ext) || this.asyncCompilers.has(ext))) {
        options = { ...options, isFixExports: false, isFixTypes: false };
      }
    }

    if (!this._visitor) this._visitor = buildVisitor(this.pluginVisitorObjects, !!ignoreExportsUsedInFile);

    return _getImportsAndExports(
      filePath,
      sourceText,
      this.resolveModule,
      options,
      ignoreExportsUsedInFile,
      skipExports,
      this._visitor,
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
