import { parseSync, Visitor, rawTransferSupported, type ParseResult, type VisitorObject } from 'oxc-parser';
import { isStringLiteral, getStringValue, stripQuotes } from './typescript/visitors/helpers.ts';
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
import { coreVisitorObject } from './typescript/visitors/walk.ts';
import { createCustomModuleResolver, type CustomModuleResolver } from './typescript/resolve-module-names.ts';
import { SourceFileManager } from './typescript/SourceFileManager.ts';
import { compact } from './util/array.ts';
import type { MainOptions } from './util/create-options.ts';
import { timerify } from './util/Performance.ts';
import { extname, isInNodeModules, toAbsolute } from './util/path.ts';
import type { ToSourceFilePath } from './util/to-source-path.ts';

const parseOptions = { sourceType: 'unambiguous' as const, experimentalRawTransfer: rawTransferSupported() };

const _requireSpecs: string[] = [];
const _requireVisitor = new Visitor({
  CallExpression(node) {
    if (node.callee?.type === 'Identifier' && node.callee.name === 'require') {
      const arg = node.arguments?.[0];
      if (isStringLiteral(arg)) _requireSpecs.push(getStringValue(arg)!);
    }
    if (
      node.callee?.type === 'MemberExpression' &&
      !node.callee.computed &&
      node.callee.object?.type === 'Identifier' &&
      node.callee.object.name === 'require' &&
      node.callee.property?.name === 'resolve'
    ) {
      const arg = node.arguments?.[0];
      if (isStringLiteral(arg)) _requireSpecs.push(getStringValue(arg)!);
    }
  },
  TSImportEqualsDeclaration(node) {
    if (node.moduleReference?.type === 'TSExternalModuleReference') {
      const expr = node.moduleReference.expression;
      if (isStringLiteral(expr)) _requireSpecs.push(getStringValue(expr)!);
    }
  },
});

const _jsDocImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

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
  private extensions = new Set(DEFAULT_EXTENSIONS);

  cache: CacheConsultant<FileNode>;
  toSourceFilePath: ToSourceFilePath;

  fileManager: SourceFileManager;
  private resolver!: CustomModuleResolver;

  resolvedFiles = new Set<string>();
  deletedFiles = new Set<string>();

  constructor(options: MainOptions, toSourceFilePath: ToSourceFilePath) {
    this.cache = new CacheConsultant('root', options);
    this.toSourceFilePath = toSourceFilePath;
    this.pluginVisitorObjects.push(createBunShellVisitor(this.pluginCtx));
    this.fileManager = new SourceFileManager({
      compilers: [this.syncCompilers, this.asyncCompilers],
      isSkipLibs: options.isSkipLibs,
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

  init() {
    this.extensions = new Set([...DEFAULT_EXTENSIONS, ...getCompilerExtensions([this.syncCompilers, this.asyncCompilers])]);
    const customCompilerExtensions = getCompilerExtensions([this.syncCompilers, this.asyncCompilers]);
    const pathsOrUndefined = Object.keys(this.paths).length > 0 ? this.paths : undefined;
    this.resolver = createCustomModuleResolver(
      { paths: pathsOrUndefined },
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
        const ext = extname(filePath);
        const parseFileName = DEFAULT_EXTENSIONS.has(ext) ? filePath : `${filePath}.ts`;
        const result = parseSync(parseFileName, sourceText, parseOptions);

        this.fileManager.sourceTextCache.delete(filePath);

        if (this.projectPaths.has(filePath)) {
          const internalPaths = analyzeFile(filePath, result, sourceText);
          if (internalPaths) {
            for (const p of internalPaths) {
              if (!visited.has(p)) queue.push(p);
            }
          }
        } else {
          this.followImportsLightweight(result, sourceText, filePath, visited, queue);
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

  private followImportsLightweight(
    result: ParseResult,
    sourceText: string,
    filePath: string,
    visited: Set<string>,
    queue: string[]
  ) {
    const mod = result.module;

    for (const si of mod.staticImports) {
      const resolved = this.resolveSpecifier(si.moduleRequest.value, filePath);
      if (resolved && !isInNodeModules(resolved)) {
        if (!visited.has(resolved)) queue.push(resolved);
      }
    }

    for (const se of mod.staticExports) {
      for (const entry of se.entries) {
        if (entry.moduleRequest) {
          const resolved = this.resolveSpecifier(entry.moduleRequest.value, filePath);
          if (resolved && !isInNodeModules(resolved)) {
            if (!visited.has(resolved)) queue.push(resolved);
          }
        }
      }
    }

    for (const di of mod.dynamicImports) {
      const cleaned = stripQuotes(sourceText.slice(di.moduleRequest.start, di.moduleRequest.end));
      if (cleaned && !cleaned.includes('$') && !cleaned.includes('+')) {
        const resolved = this.resolveSpecifier(cleaned, filePath);
        if (resolved && !isInNodeModules(resolved)) {
          if (!visited.has(resolved)) queue.push(resolved);
        }
      }
    }

    if (!isInNodeModules(filePath)) {
      _requireSpecs.length = 0;
      _requireVisitor.visit(result.program);
      for (const spec of _requireSpecs) {
        const resolved = this.resolveSpecifier(spec, filePath);
        if (resolved && !isInNodeModules(resolved)) {
          if (!visited.has(resolved)) queue.push(resolved);
        }
      }
    }

    for (const comment of result.comments) {
      if (comment.type !== 'Block') continue;
      let m: RegExpExecArray | null;
      _jsDocImportRe.lastIndex = 0;
      while ((m = _jsDocImportRe.exec(comment.value)) !== null) {
        const resolved = this.resolveSpecifier(m[1], filePath);
        if (resolved && !isInNodeModules(resolved)) {
          if (!visited.has(resolved)) queue.push(resolved);
        }
      }
    }
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
        const ext = extname(filePath);
        const parseFileName = DEFAULT_EXTENSIONS.has(ext) ? filePath : `${filePath}.ts`;
        const result = parseSync(parseFileName, sourceText, parseOptions);
        this.followImportsLightweight(result, sourceText, filePath, visited, queue);
      } catch {
        // Parse error — skip this file
      }
    }

    this.resolvedFiles = visited;
    return Array.from(this.projectPaths).filter(filePath => visited.has(filePath));
  }

  private resolveSpecifier(specifier: string, containingFile: string): string | undefined {
    return this.resolver.resolveFileName(specifier, containingFile);
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

    const resolveModule = this.resolver.resolveModuleName;

    if (!this._visitor) this._visitor = this.buildVisitor();

    return _getImportsAndExports(
      filePath,
      sourceText,
      resolveModule,
      options,
      ignoreExportsUsedInFile,
      skipExports,
      this._visitor,
      this.pluginVisitorObjects.length > 0 ? this.pluginCtx : undefined,
      parseResult
    );
  }

  private buildVisitor(): Visitor {
    if (this.pluginVisitorObjects.length === 0) return new Visitor(coreVisitorObject);
    type HandlerMap = Record<string, ((node: never) => void) | undefined>;
    const merged: HandlerMap = { ...(coreVisitorObject as HandlerMap) };
    for (const obj of this.pluginVisitorObjects) {
      const handlers = obj as HandlerMap;
      for (const key in handlers) {
        const existing = merged[key];
        const pluginFn = handlers[key];
        if (!pluginFn) continue;
        if (existing) {
          merged[key] = (node: never) => {
            existing(node);
            pluginFn(node);
          };
        } else {
          merged[key] = pluginFn;
        }
      }
    }
    return new Visitor(merged as VisitorObject);
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
