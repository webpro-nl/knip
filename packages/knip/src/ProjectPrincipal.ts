import { isBuiltin } from 'node:module';
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
import type { FileNode } from './types/module-graph.ts';
import type { Paths } from './types/project.ts';
import { _getImportsAndExports } from './typescript/get-imports-and-exports.ts';
import { createBunShellVisitor } from './typescript/visitors/script-visitors.ts';
import { buildVisitor } from './typescript/visitors/walk.ts';
import {
  createCustomModuleResolver,
  createGlobAliasResolver,
  getDecidingDirs,
  getNodeModulesDirs,
  isBareSpecifier,
} from './typescript/resolve-module-names.ts';
import type { ResolveGlobPattern } from './typescript/resolve-module-names.ts';
import type { ResolveModule } from './typescript/ast-nodes.ts';
import { SourceFileManager } from './typescript/SourceFileManager.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { fileStamp, toFingerprint } from './util/disk-cache.ts';
import { isExistingFile, statDirMtime } from './util/fs-cache.ts';
import { timerify } from './util/Performance.ts';
import { dirname, extname, isInNodeModules, join, toAbsolute } from './util/path.ts';
import type { ToSourceFilePath, WorkspacePackageTargetHandler } from './util/to-source-path.ts';

type Resolutions = Array<[specifier: string, resolvedFileName: string | undefined]>;

type CacheEntry = { node: FileNode; resolutions: Resolutions; dirMtimes: Record<string, number> };

const nodeModulesDirsByDir = new Map<string, string[]>();
const decidingDirsByTarget = new Map<string, string[]>();

const getMemoizedDecidingDirs = (filePath: string, specifier: string, resolvedFileName: string) => {
  if (!isBareSpecifier(specifier)) return getDecidingDirs(filePath, specifier, resolvedFileName);
  let dirs = decidingDirsByTarget.get(resolvedFileName);
  if (!dirs) {
    dirs = getDecidingDirs(filePath, specifier, resolvedFileName);
    decidingDirsByTarget.set(resolvedFileName, dirs);
  }
  return dirs;
};

const getMemoizedNodeModulesDirs = (filePath: string) => {
  const dir = dirname(filePath);
  let dirs = nodeModulesDirsByDir.get(dir);
  if (!dirs) {
    dirs = getNodeModulesDirs(filePath);
    nodeModulesDirsByDir.set(dir, dirs);
  }
  return dirs;
};

const getDirMtimes = (filePath: string, resolutions: Resolutions) => {
  const dirMtimes: Record<string, number> = {};
  const add = (dir: string) => {
    if (dir in dirMtimes) return;
    const mtime = statDirMtime(dir);
    if (!Number.isNaN(mtime)) dirMtimes[dir] = mtime;
  };
  let hasBareSpecifier = false;
  for (const [specifier, resolvedFileName] of resolutions) {
    if (!resolvedFileName) continue;
    if (isBareSpecifier(specifier)) hasBareSpecifier = true;
    if (!isInNodeModules(resolvedFileName))
      for (const dir of getMemoizedDecidingDirs(filePath, specifier, resolvedFileName)) add(dir);
  }
  if (hasBareSpecifier) for (const dir of getMemoizedNodeModulesDirs(filePath)) add(dir);
  return dirMtimes;
};

const _getDirMtimes = timerify(getDirMtimes);

const hasChangedDir = (dirs: string[], changedDirs: Set<string>) => {
  for (const dir of dirs) if (changedDirs.has(dir)) return true;
  return false;
};

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

  cache: CacheConsultant<CacheEntry> | undefined;
  private analyzed = new Map<string, CacheEntry>();
  private options: MainOptions;
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
    this.options = options;
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
    this.hasSameResolutions = timerify(this.hasSameResolutions.bind(this), 'hasSameResolutions');
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

  init(cacheKey?: Record<string, unknown>) {
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
    if (this.options.isCache) {
      const compilers = Array.from(this.scopedCompilers, ([ext, byWorkspace]) => [
        ext,
        Array.from(byWorkspace, ([name, compiler]) => [name, String(compiler)]),
      ]);
      const pnpStamp = process.versions.pnp ? fileStamp(join(this.options.cwd, '.pnp.cjs')) : undefined;
      const resolverKey = [scopedPaths, scopedRootDirs, compilers, this.tsConfigFile, pnpStamp];
      this.cache = new CacheConsultant('root', this.options, toFingerprint({ ...cacheKey, resolver: resolverKey }));
    }
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
    if (!this.cache) return undefined;
    const skipExports = this.skipExportsAnalysis.has(filePath) || !this.isReportExports;
    const isValid = (entry: CacheEntry) =>
      entry.node.skipExports === skipExports && this.hasSameResolutions(filePath, entry);
    return this.cache.getCachedFile(filePath, isValid)?.node;
  }

  private hasSameResolutions(filePath: string, entry: CacheEntry) {
    const { resolutions, dirMtimes } = entry;
    let changedDirs: Set<string> | undefined;
    for (const dir in dirMtimes) {
      if (statDirMtime(dir) !== dirMtimes[dir]) (changedDirs ??= new Set()).add(dir);
    }
    let isNodeModulesChanged: boolean | undefined;
    for (const [specifier, resolvedFileName] of resolutions) {
      let isRevalidate = !resolvedFileName;
      if (resolvedFileName && changedDirs) {
        if (isBareSpecifier(specifier)) {
          isNodeModulesChanged ??= hasChangedDir(getMemoizedNodeModulesDirs(filePath), changedDirs);
          isRevalidate = isNodeModulesChanged;
        }
        if (!isRevalidate && !isInNodeModules(resolvedFileName)) {
          isRevalidate = hasChangedDir(getMemoizedDecidingDirs(filePath, specifier, resolvedFileName), changedDirs);
        }
      }
      if (isRevalidate) {
        if (this.resolveSpecifier(specifier, filePath) !== resolvedFileName) return false;
      } else if (resolvedFileName && isInNodeModules(resolvedFileName) && !isExistingFile(resolvedFileName)) {
        return false;
      }
    }
    if (changedDirs) {
      for (const dir of changedDirs) {
        const mtime = statDirMtime(dir);
        if (Number.isNaN(mtime)) delete dirMtimes[dir];
        else dirMtimes[dir] = mtime;
      }
      this.cache?.setData(filePath, entry);
    }
    return true;
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

    const resolutions = this.cache ? new Map<string, string | undefined>() : undefined;
    const resolveModule: ResolveModule = resolutions
      ? (specifier, containingFile) => {
          const module = this.resolveModule(specifier, containingFile);
          if (!isBuiltin(specifier)) resolutions.set(specifier, module?.resolvedFileName);
          return module;
        }
      : this.resolveModule;

    const node = _getImportsAndExports(
      filePath,
      sourceText,
      resolveModule,
      options,
      ignoreExportsUsedInFile,
      skipExports,
      visitor,
      this.pluginVisitorObjects.length > 0 ? this.pluginCtx : undefined,
      parseResult
    );

    if (resolutions) {
      const recorded = Array.from(resolutions);
      this.analyzed.set(filePath, { node, resolutions: recorded, dirMtimes: _getDirMtimes(filePath, recorded) });
    }

    return node;
  }

  invalidateFile(filePath: string) {
    this.fileManager.invalidate(filePath);
    this.cache?.removeEntry(filePath);
    this.analyzed.delete(filePath);
  }

  reconcileCache() {
    if (!this.cache) return;
    for (const [filePath, entry] of this.analyzed) this.cache.setData(filePath, entry);
    this.analyzed.clear();
    this.cache.reconcile();
  }
}
