import ts from 'typescript';
import { CacheConsultant } from './CacheConsultant.js';
import { getCompilerExtensions } from './compilers/index.js';
import type { AsyncCompilers, SyncCompilers } from './compilers/types.js';
import { ANONYMOUS, DEFAULT_EXTENSIONS, FOREIGN_FILE_EXTENSIONS, PUBLIC_TAG } from './constants.js';
import type { GetImportsAndExportsOptions } from './types/config.js';
import type { Export, ExportMember, FileNode, ModuleGraph, UnresolvedImport } from './types/module-graph.js';
import type { PrincipalOptions } from './types/project.js';
import type { BoundSourceFile } from './typescript/SourceFile.js';
import type { SourceFileManager } from './typescript/SourceFileManager.js';
import { createHosts } from './typescript/create-hosts.js';
import { _getImportsAndExports } from './typescript/get-imports-and-exports.js';
import type { ResolveModuleNames } from './typescript/resolve-module-names.js';
import { timerify } from './util/Performance.js';
import { compact } from './util/array.js';
import { getPackageNameFromModuleSpecifier, isStartsLikePackageName, sanitizeSpecifier } from './util/modules.js';
import { dirname, extname, isInNodeModules, join } from './util/path.js';
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
 * This class aims to abstract away TypeScript specific things from the main flow.
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
  nonEntryPaths = new Set<string>();

  // We don't want to report unused exports of config/plugin entry files
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

  // @ts-expect-error Don't want to ignore this, but we're not touching this until after init()
  backend: {
    fileManager: SourceFileManager;
    compilerHost: ts.CompilerHost;
    resolveModuleNames: ResolveModuleNames;
    program?: ts.Program;
    typeChecker?: ts.TypeChecker;
    languageServiceHost: ts.LanguageServiceHost;
  };

  findReferences?: ts.LanguageService['findReferences'];

  constructor({
    compilerOptions,
    cwd,
    compilers,
    isSkipLibs,
    isWatch,
    pkgName,
    toSourceFilePath,
    isCache,
    cacheLocation,
  }: PrincipalOptions) {
    this.cwd = cwd;

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
    this.isSkipLibs = isSkipLibs;
    this.isWatch = isWatch;
    this.cache = new CacheConsultant({ name: pkgName || ANONYMOUS, isEnabled: isCache, cacheLocation });
    this.toSourceFilePath = toSourceFilePath;
  }

  init() {
    const { fileManager, compilerHost, resolveModuleNames, languageServiceHost } = createHosts({
      cwd: this.cwd,
      compilerOptions: this.compilerOptions,
      entryPaths: this.entryPaths,
      compilers: [this.syncCompilers, this.asyncCompilers],
      isSkipLibs: this.isSkipLibs,
      toSourceFilePath: this.toSourceFilePath,
      useResolverCache: !this.isWatch,
    });

    this.backend = {
      fileManager,
      compilerHost,
      resolveModuleNames,
      languageServiceHost,
    };
  }

  addPaths(paths: ts.CompilerOptions['paths']) {
    this.compilerOptions.paths = { ...this.compilerOptions.paths, ...paths };
  }

  addCompilers(compilers: [SyncCompilers, AsyncCompilers]) {
    this.syncCompilers = new Map([...this.syncCompilers, ...compilers[0]]);
    this.asyncCompilers = new Map([...this.asyncCompilers, ...compilers[1]]);
    this.extensions = new Set([...this.extensions, ...getCompilerExtensions(compilers)]);
  }

  /**
   * `ts.createProgram()` resolves files starting from the provided entry/root files. Calling `program.getTypeChecker()`
   * binds files and symbols (including symbols and maps like `sourceFile.resolvedModules` and `sourceFile.symbols`)
   */
  private createProgram() {
    this.backend.program = tsCreateProgram(
      [...this.entryPaths, ...this.nonEntryPaths],
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

  public addNonEntryPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.nonEntryPaths.add(filePath);
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
    options: Omit<GetImportsAndExportsOptions, 'skipExports'>,
    isGitIgnored: (filePath: string) => boolean,
    isInternalWorkspace: (packageName: string) => boolean,
    getPrincipalByFilePath: (filePath: string) => undefined | ProjectPrincipal
  ) {
    const fd = this.cache.getFileDescriptor(filePath);
    if (!fd.changed && fd.meta?.data) return fd.meta.data;

    const typeChecker = this.backend.typeChecker;

    if (!typeChecker) throw new Error('Must initialize TypeChecker before source file analysis');

    // We request it from `fileManager` directly as `program` does not contain cross-referenced files
    const sourceFile: BoundSourceFile | undefined = this.backend.fileManager.getSourceFile(filePath);

    if (!sourceFile) throw new Error(`Unable to find ${filePath}`);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    const resolve = (specifier: string) => this.backend.resolveModuleNames([specifier], sourceFile.fileName)[0];

    const { imports, ...rest } = _getImportsAndExports(sourceFile, resolve, typeChecker, { ...options, skipExports });

    const { internal, resolved, specifiers, unresolved, external } = imports;

    const unresolvedImports = new Set<UnresolvedImport>();

    for (const [specifier, specifierFilePath] of specifiers) {
      const packageName = getPackageNameFromModuleSpecifier(specifier);
      if (packageName && isInternalWorkspace(packageName)) {
        external.add(packageName);
        const principal = getPrincipalByFilePath(specifierFilePath);
        if (principal && !isGitIgnored(specifierFilePath)) principal.addNonEntryPath(specifierFilePath);
      }
    }

    for (const filePath of resolved) {
      const isIgnored = isGitIgnored(filePath);
      if (!isIgnored) this.addEntryPath(filePath, { skipExportsAnalysis: true });
    }

    for (const unresolvedImport of unresolved) {
      const { specifier } = unresolvedImport;

      // Ignore Deno style http import specifiers
      if (specifier.startsWith('http')) continue;

      // All bets are off after failing to resolve module:
      // - either add to external dependencies if it quacks like that so it'll end up as unused or unlisted dependency
      // - or maintain unresolved status if not ignored and not foreign
      const sanitizedSpecifier = sanitizeSpecifier(specifier);
      if (isStartsLikePackageName(sanitizedSpecifier)) {
        external.add(sanitizedSpecifier);
      } else {
        const isIgnored = isGitIgnored(join(dirname(filePath), sanitizedSpecifier));
        if (!isIgnored) {
          const ext = extname(sanitizedSpecifier);
          const hasIgnoredExtension = FOREIGN_FILE_EXTENSIONS.has(ext);
          if (!ext || (ext !== '.json' && !hasIgnoredExtension)) {
            unresolvedImports.add(unresolvedImport);
          }
        }
      }
    }

    return { imports: { internal, unresolved: unresolvedImports, external }, ...rest };
  }

  invalidateFile(filePath: string) {
    this.backend.fileManager.snapshotCache.delete(filePath);
    this.backend.fileManager.sourceFileCache.delete(filePath);
  }

  public findUnusedMembers(filePath: string, members: ExportMember[]) {
    if (!this.findReferences) {
      const languageService = ts.createLanguageService(this.backend.languageServiceHost, ts.createDocumentRegistry());
      this.findReferences = timerify(languageService.findReferences);
    }

    return members.filter(member => {
      if (member.jsDocTags.has(PUBLIC_TAG)) return false;
      const referencedSymbols = this.findReferences?.(filePath, member.pos) ?? [];
      const refs = referencedSymbols.flatMap(refs => refs.references).filter(ref => !ref.isDefinition);
      return refs.length === 0;
    });
  }

  public hasExternalReferences(filePath: string, exportedItem: Export) {
    if (exportedItem.jsDocTags.has(PUBLIC_TAG)) return false;

    if (!this.findReferences) {
      const languageService = ts.createLanguageService(this.backend.languageServiceHost, ts.createDocumentRegistry());
      this.findReferences = timerify(languageService.findReferences);
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
    for (const [filePath, file] of graph.entries()) {
      const fd = this.cache.getFileDescriptor(filePath);
      if (!fd?.meta) continue;
      const { imported, internalImportCache, ...clone } = file;
      fd.meta.data = clone;
    }
    this.cache.reconcile();
  }
}
