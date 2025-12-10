import ts from 'typescript';
import { CacheConsultant } from './CacheConsultant.js';
import { getCompilerExtensions } from './compilers/index.js';
import type { AsyncCompilers, SyncCompilers } from './compilers/types.js';
import { ANONYMOUS, DEFAULT_EXTENSIONS, PUBLIC_TAG } from './constants.js';
import type { GetImportsAndExportsOptions, IgnoreExportsUsedInFile } from './types/config.js';
import type { Export, ExportMember, FileNode, ModuleGraph } from './types/module-graph.js';
import type { Paths, PrincipalOptions } from './types/project.js';
import { createHosts } from './typescript/create-hosts.js';
import { _getImportsAndExports } from './typescript/get-imports-and-exports.js';
import type { ResolveModuleNames } from './typescript/resolve-module-names.js';
import type { BoundSourceFile } from './typescript/SourceFile.js';
import { SourceFileManager } from './typescript/SourceFileManager.js';
import { compact } from './util/array.js';
import type { MainOptions } from './util/create-options.js';
import { timerify } from './util/Performance.js';
import { extname, isInNodeModules, toAbsolute } from './util/path.js';
import type { ToSourceFilePath } from './util/to-source-path.js';

// These compiler options override local options
const baseCompilerOptions: ts.CompilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  declaration: false,
  declarationMap: false,
  esModuleInterop: true,
  inlineSourceMap: false,
  inlineSources: false,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: undefined,
  lib: [],
  noEmit: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  sourceMap: false,
  types: ['node'],
};

const tsCreateProgram = timerify(ts.createProgram);

/**
 * Abstracts away TypeScript API from the main flow
 *
 * - Provided by the principal factory
 * - Collects entry and project paths
 * - Installs TS backend: file manager, language and compiler hosts for the TS program
 * - Creates TS program and typechecker
 * - Run async compilers ahead of time since the TS machinery is fully sync
 * - Bridge between main flow and TS AST walker
 */
export class ProjectPrincipal {
  // Configured by user and returned from plugins
  entryPaths = new Set<string>();
  projectPaths = new Set<string>();
  programPaths = new Set<string>();

  // Don't report unused exports of config/plugin entry files
  skipExportsAnalysis = new Set<string>();

  cwd: string;
  compilerOptions: ts.CompilerOptions;
  extensions: Set<string>;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;
  isSkipLibs: boolean;
  isWatch: boolean;

  cache: CacheConsultant<FileNode>;

  toSourceFilePath: ToSourceFilePath;

  backend: {
    fileManager: SourceFileManager;
    compilerHost?: ts.CompilerHost;
    resolveModuleNames: ResolveModuleNames;
    program?: ts.Program;
    typeChecker?: ts.TypeChecker;
    languageServiceHost: ts.LanguageServiceHost;
  };

  findReferences?: ts.LanguageService['findReferences'];
  getImplementationAtPosition?: ts.LanguageService['getImplementationAtPosition'];

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
    this.isSkipLibs = options.isSkipLibs;
    this.isWatch = options.isWatch;
    this.cache = new CacheConsultant(pkgName || ANONYMOUS, options);
    this.toSourceFilePath = toSourceFilePath;

    // @ts-expect-error Don't want to ignore this, but we're not touching this until after init()
    this.backend = {
      fileManager: new SourceFileManager({ compilers, isSkipLibs: options.isSkipLibs }),
    };
  }

  init() {
    const { compilerHost, resolveModuleNames, languageServiceHost } = createHosts({
      cwd: this.cwd,
      compilerOptions: this.compilerOptions,
      entryPaths: this.entryPaths,
      compilers: [this.syncCompilers, this.asyncCompilers],
      isSkipLibs: this.isSkipLibs,
      toSourceFilePath: this.toSourceFilePath,
      useResolverCache: !this.isWatch,
      fileManager: this.backend.fileManager,
    });

    this.backend.compilerHost = compilerHost;
    this.backend.resolveModuleNames = resolveModuleNames;
    this.backend.languageServiceHost = languageServiceHost;
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

  addCompilers(compilers: [SyncCompilers, AsyncCompilers]) {
    this.syncCompilers = new Map([...this.syncCompilers, ...compilers[0]]);
    this.asyncCompilers = new Map([...this.asyncCompilers, ...compilers[1]]);
    this.extensions = new Set([...this.extensions, ...getCompilerExtensions(compilers)]);
  }

  /**
   * `ts.createProgram()` resolves files starting from the provided entry/root
   * files. Calling `program.getTypeChecker()` binds files and symbols
   */
  private createProgram() {
    this.backend.program = tsCreateProgram(
      [...this.entryPaths, ...this.programPaths],
      this.compilerOptions,
      this.backend.compilerHost,
      this.backend.program
    );

    const typeChecker = timerify(this.backend.program.getTypeChecker);
    this.backend.typeChecker = typeChecker();
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

  public getUsedResolvedFiles() {
    this.createProgram();
    const sourceFiles = this.getProgramSourceFiles();
    return Array.from(this.projectPaths).filter(filePath => sourceFiles.has(filePath));
  }

  private getProgramSourceFiles() {
    const programSourceFiles = this.backend.program?.getSourceFiles().map(sourceFile => sourceFile.fileName);
    return new Set(programSourceFiles);
  }

  public getUnreferencedFiles() {
    const sourceFiles = this.getProgramSourceFiles();
    return Array.from(this.projectPaths).filter(filePath => !sourceFiles.has(filePath));
  }

  public analyzeSourceFile(
    filePath: string,
    options: GetImportsAndExportsOptions,
    ignoreExportsUsedInFile: IgnoreExportsUsedInFile
  ) {
    const fd = this.cache.getFileDescriptor(filePath);
    if (!fd.changed && fd.meta?.data) return fd.meta.data;

    const typeChecker = this.backend.typeChecker;

    if (!typeChecker) throw new Error('TypeChecker must be initialized before source file analysis');

    // We request it from `fileManager` directly as `program` does not contain cross-referenced files
    const sourceFile: BoundSourceFile | undefined = this.backend.fileManager.getSourceFile(filePath);

    if (!sourceFile) throw new Error(`Unable to find ${filePath}`);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    const resolve = (specifier: string) => this.backend.resolveModuleNames([specifier], sourceFile.fileName)[0];

    return _getImportsAndExports(sourceFile, resolve, typeChecker, options, ignoreExportsUsedInFile, skipExports);
  }

  invalidateFile(filePath: string) {
    this.backend.fileManager.snapshotCache.delete(filePath);
    this.backend.fileManager.sourceFileCache.delete(filePath);
  }

  public findUnusedMembers(filePath: string, members: ExportMember[]) {
    if (!this.findReferences || !this.getImplementationAtPosition) {
      const languageService = ts.createLanguageService(this.backend.languageServiceHost, ts.createDocumentRegistry());
      this.findReferences = timerify(languageService.findReferences);
      this.getImplementationAtPosition = timerify(languageService.getImplementationAtPosition);
    }

    return members.filter(member => {
      if (member.jsDocTags.has(PUBLIC_TAG)) return false;
      const implementations =
        this.getImplementationAtPosition?.(filePath, member.pos)?.filter(
          impl => impl.fileName !== filePath || impl.textSpan.start !== member.pos
        ) ?? [];

      const referencedSymbols =
        this.findReferences?.(filePath, member.pos)?.filter(
          sym =>
            !implementations.some(
              impl =>
                impl.fileName === sym.definition.fileName &&
                impl.textSpan.start === sym.definition.textSpan.start &&
                impl.textSpan.length === sym.definition.textSpan.length
            )
        ) ?? [];

      const refs = referencedSymbols.flatMap(refs => refs.references).filter(ref => !ref.isDefinition);
      return refs.length === 0;
    });
  }

  public hasExternalReferences(filePath: string, exportedItem: Export) {
    if (exportedItem.jsDocTags.has(PUBLIC_TAG)) return false;

    if (!this.findReferences || !this.getImplementationAtPosition) {
      const languageService = ts.createLanguageService(this.backend.languageServiceHost, ts.createDocumentRegistry());
      this.findReferences = timerify(languageService.findReferences);
      this.getImplementationAtPosition = timerify(languageService.getImplementationAtPosition);
    }

    const referencedSymbols = this.findReferences(filePath, exportedItem.pos);

    if (!referencedSymbols?.length) return false;

    const externalRefs = referencedSymbols
      .flatMap(refs => refs.references)
      .filter(ref => !ref.isDefinition && ref.fileName !== filePath)
      .filter(ref => {
        // Filter out are re-exports
        const sourceFile = this.backend.program?.getSourceFile(ref.fileName);
        if (!sourceFile) return true;
        // @ts-expect-error ts.getTokenAtPosition is internal fn
        const node = ts.getTokenAtPosition(sourceFile, ref.textSpan.start);
        if (!node?.parent?.parent?.parent) return true;
        return !(ts.isExportSpecifier(node.parent) && node.parent.parent.parent.moduleSpecifier);
      });

    return externalRefs.length > 0;
  }

  reconcileCache(graph: ModuleGraph) {
    for (const [filePath, file] of graph) {
      const fd = this.cache.getFileDescriptor(filePath);
      if (!fd?.meta) continue;
      // biome-ignore lint: correctness/noUnusedVariables
      const { imported, internalImportCache, ...clone } = file;
      fd.meta.data = clone;
    }
    this.cache.reconcile();
  }
}
