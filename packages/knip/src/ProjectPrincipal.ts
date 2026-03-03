import { parseSync, Visitor, rawTransferSupported, type ParseResult, type VisitorObject } from 'oxc-parser';
import { isStringLiteral, getStringValue, stripQuotes } from './typescript/visitors/helpers.ts';
import { CacheConsultant } from './CacheConsultant.ts';
import { getCompilerExtensions } from './compilers/index.ts';
import type { AsyncCompilers, SyncCompilers } from './compilers/types.ts';
import { ANONYMOUS, DEFAULT_EXTENSIONS } from './constants.ts';
import type {
  GetImportsAndExportsOptions,
  IgnoreExportsUsedInFile,
  PluginVisitorContext,
  PluginVisitorObject,
} from './types/config.ts';
import type { FileNode, ModuleGraph } from './types/module-graph.ts';
import type { CompilerOptions, Paths, PrincipalOptions } from './types/project.ts';
import { _getImportsAndExports } from './typescript/get-imports-and-exports.ts';
import { createBunShellVisitor } from './typescript/visitors/script-visitors.ts';
import { coreVisitorObject } from './typescript/visitors/walk.ts';
import { createCustomModuleResolver, type ResolveModuleNames } from './typescript/resolve-module-names.ts';
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

// These compiler options override local options
const baseCompilerOptions: CompilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  declaration: false,
  declarationMap: false,
  esModuleInterop: true,
  inlineSourceMap: false,
  inlineSources: false,
  jsx: 1,
  jsxImportSource: undefined,
  lib: [],
  noEmit: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  sourceMap: false,
  types: ['node'],
};

interface ResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport: boolean;
}

export class ProjectPrincipal {
  entryPaths = new Set<string>();
  projectPaths = new Set<string>();
  programPaths = new Set<string>();

  // Don't report unused exports of config/plugin entry files
  skipExportsAnalysis = new Set<string>();

  pluginCtx: PluginVisitorContext = {
    filePath: '',
    sourceText: '',
    addScript: () => {},
    addImport: () => {},
  };
  pluginVisitorObjects: PluginVisitorObject[] = [];
  private _visitor: Visitor | undefined;

  cwd: string;
  compilerOptions: CompilerOptions;
  extensions: Set<string>;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;
  isWatch: boolean;

  cache: CacheConsultant<FileNode>;

  toSourceFilePath: ToSourceFilePath;

  backend: {
    fileManager: SourceFileManager;
    resolveModule: ResolveModuleNames;
  };

  private resolvedFiles = new Set<string>();

  constructor(options: MainOptions, { compilerOptions, compilers, pkgName, toSourceFilePath }: PrincipalOptions) {
    this.compilerOptions = {
      ...compilerOptions,
      ...baseCompilerOptions,
      types: compact([...(compilerOptions.types ?? []), ...(baseCompilerOptions.types ?? [])]),
      allowNonTsExtensions: true,
    };

    const [syncCompilers, asyncCompilers] = compilers;
    this.extensions = new Set([...DEFAULT_EXTENSIONS, ...getCompilerExtensions(compilers)]);
    this.syncCompilers = syncCompilers;
    this.asyncCompilers = asyncCompilers;
    this.cwd = options.cwd;
    this.isWatch = options.isWatch || options.isSession;
    this.cache = new CacheConsultant(pkgName || ANONYMOUS, options);
    this.toSourceFilePath = toSourceFilePath;
    this.pluginVisitorObjects.push(createBunShellVisitor(this.pluginCtx));

    // @ts-expect-error Don't want to ignore this, but we're not touching this until after init()
    this.backend = {
      fileManager: new SourceFileManager({ compilers, isSkipLibs: options.isSkipLibs }),
    };
  }

  init() {
    const customCompilerExtensions = getCompilerExtensions([this.syncCompilers, this.asyncCompilers]);
    this.backend.resolveModule = createCustomModuleResolver(
      this.compilerOptions,
      customCompilerExtensions,
      this.toSourceFilePath,
      !this.isWatch
    );
  }

  addPaths(paths: Paths, basePath: string) {
    if (!paths) return;
    this.compilerOptions.paths ??= {};
    for (const key in paths) {
      const prefixes = paths[key].map(prefix => toAbsolute(prefix, basePath));
      if (key in this.compilerOptions.paths) {
        this.compilerOptions.paths[key] = compact([...this.compilerOptions.paths[key], ...prefixes]);
      } else {
        this.compilerOptions.paths[key] = prefixes;
      }
    }
  }

  private hasAcceptedExtension(filePath: string) {
    return this.extensions.has(extname(filePath));
  }

  public addEntryPath(filePath: string, options?: { skipExportsAnalysis: boolean }) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.entryPaths.add(filePath);
      this.projectPaths.add(filePath);
      if (options?.skipExportsAnalysis) this.skipExportsAnalysis.add(filePath);
    }
  }

  public addEntryPaths(filePaths: Set<string> | string[], options?: { skipExportsAnalysis: boolean }) {
    for (const filePath of filePaths) this.addEntryPath(filePath, options);
  }

  public addProgramPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.programPaths.add(filePath);
    }
  }

  public addProjectPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.projectPaths.add(filePath);
      this.deletedFiles.delete(filePath);
    }
  }

  // TODO Organize better
  deletedFiles = new Set();
  public removeProjectPath(filePath: string) {
    this.entryPaths.delete(filePath);
    this.projectPaths.delete(filePath);
    this.invalidateFile(filePath);
    this.deletedFiles.add(filePath);
  }

  /**
   * Compile files with async compilers _before_ `ts.createProgram()`, since the TypeScript hosts machinery is fully
   * synchronous (eg. `ts.sys.readFile` and `host.resolveModuleNames`)
   */
  public async runAsyncCompilers() {
    const add = timerify(this.backend.fileManager.compileAndAddSourceFile.bind(this.backend.fileManager));
    const extensions = Array.from(this.asyncCompilers.keys());
    const files = Array.from(this.projectPaths).filter(filePath => extensions.includes(extname(filePath)));
    for (const filePath of files) {
      await add(filePath);
    }
  }

  /**
   * Walk import graph from entries, analyzing each project file inline.
   * Each file is parsed ONCE — the parse result is used for both graph following and full analysis.
   * For project files, analyzeFile is called with the parse result.
   * For non-project files, lightweight import following is used.
   */
  public walkAndAnalyze(
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

      const sourceText = this.backend.fileManager.readFile(filePath);

      if (!sourceText) {
        if (this.projectPaths.has(filePath)) analyzeFile(filePath, undefined, '');
        continue;
      }

      try {
        const ext = extname(filePath);
        const parseFileName = DEFAULT_EXTENSIONS.has(ext) ? filePath : `${filePath}.ts`;
        const result = parseSync(parseFileName, sourceText, parseOptions);

        this.backend.fileManager.sourceTextCache.delete(filePath);

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

        // Pick up new entries added by analysis (e.g. from script handling)
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

  /**
   * Legacy graph walk without inline analysis.
   * Only used when walkAndAnalyze is not applicable (e.g. watch mode re-walks).
   */
  public getUsedResolvedFiles() {
    this.resolvedFiles.clear();
    const queue = [...this.entryPaths, ...this.programPaths];
    const visited = new Set<string>();

    for (let i = 0; i < queue.length; i++) {
      const filePath = queue[i];
      if (visited.has(filePath)) continue;
      visited.add(filePath);

      const sourceText = this.backend.fileManager.readFile(filePath);
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
    return this.backend.resolveModule(specifier, containingFile)?.resolvedFileName;
  }

  public getUnreferencedFiles() {
    return Array.from(this.projectPaths).filter(filePath => !this.resolvedFiles.has(filePath));
  }

  public analyzeSourceFile(
    filePath: string,
    options: GetImportsAndExportsOptions,
    ignoreExportsUsedInFile: IgnoreExportsUsedInFile,
    parseResult?: ParseResult,
    sourceText?: string
  ) {
    const fd = this.cache.getFileDescriptor(filePath);
    if (!fd.changed && fd.meta?.data) return fd.meta.data;

    sourceText ??= this.backend.fileManager.readFile(filePath);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    if (options.isFixExports || options.isFixTypes) {
      const ext = extname(filePath);
      if (!DEFAULT_EXTENSIONS.has(ext) && (this.syncCompilers.has(ext) || this.asyncCompilers.has(ext))) {
        options = { ...options, isFixExports: false, isFixTypes: false };
      }
    }

    const resolveModule = (specifier: string, containingFile: string): ResolvedModule | undefined => {
      const resolved = this.backend.resolveModule(specifier, containingFile);
      if (!resolved) return undefined;
      return {
        resolvedFileName: resolved.resolvedFileName,
        isExternalLibraryImport: resolved.isExternalLibraryImport ?? false,
      };
    };

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
    this.backend.fileManager.invalidate(filePath);
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
