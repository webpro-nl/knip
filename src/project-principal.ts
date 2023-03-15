import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from './constants.js';
import { IGNORED_FILE_EXTENSIONS } from './constants.js';
import { getImportsAndExports } from './typescript/ast-walker.js';
import { createHosts } from './typescript/createHosts.js';
import { SourceFileManager } from './typescript/SourceFileManager.js';
import { extname, isInNodeModules } from './util/path.js';
import { timerify } from './util/performance.js';
import type { ExportItem, ExportItemMember } from './types/ast.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';
import type { Report } from './types/issues.js';
import { Workspace } from 'src/configuration-chief.js';

type ProjectPrincipalOptions = {
  compilerOptions: ts.CompilerOptions;
  cwd: string;
  report: Report;
  compilers: [SyncCompilers, AsyncCompilers];
};

// These compiler options override local options
const baseCompilerOptions = {
  allowJs: true,
  jsx: ts.JsxEmit.Preserve,
  jsxImportSource: undefined,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  lib: [],
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
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
  entryPaths: Set<string> = new Set();
  projectPaths: Set<string> = new Set();

  // We don't want to report unused exports of entry files
  skipExportsAnalysis: Set<string> = new Set();

  cwd: string;
  compilerOptions: ts.CompilerOptions;
  isReportTypes: boolean;
  extensions: Set<string>;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;

  backend: {
    fileManager: SourceFileManager;
    compilerHost: ts.CompilerHost;
    languageServiceHost: ts.LanguageServiceHost;
    lsFindReferences: ts.LanguageService['findReferences'];
    program?: ts.Program;
  };

  constructor({ compilerOptions, cwd, report, compilers }: ProjectPrincipalOptions) {
    this.cwd = cwd;

    this.compilerOptions = {
      ...compilerOptions,
      ...baseCompilerOptions,
      allowNonTsExtensions: [...compilers].flat().length > 0,
    };

    const [syncCompilers, asyncCompilers] = compilers;
    this.isReportTypes = report.types || report.nsTypes || report.enumMembers;
    this.extensions = new Set([...DEFAULT_EXTENSIONS, ...syncCompilers.keys(), ...asyncCompilers.keys()]);
    this.syncCompilers = syncCompilers;
    this.asyncCompilers = asyncCompilers;

    const { fileManager, compilerHost, languageServiceHost } = createHosts({
      cwd: this.cwd,
      compilerOptions: this.compilerOptions,
      entryPaths: this.entryPaths,
      compilers: [this.syncCompilers, this.asyncCompilers],
    });

    const languageService = ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());

    const lsFindReferences = timerify(languageService?.findReferences);

    this.backend = {
      fileManager,
      compilerHost,
      languageServiceHost,
      lsFindReferences,
    };
  }

  /**
   * `ts.createProgram()` resolves files starting from the provided entry/root files. Calling `program.getTypeChecker()`
   * binds files and symbols (including symbols and maps like `sourceFile.resolvedModules` and `sourceFile.symbols`)
   */
  private createProgram() {
    this.backend.program = tsCreateProgram(
      Array.from(this.entryPaths),
      this.compilerOptions,
      this.backend.compilerHost,
      this.backend.program
    );

    const typeChecker = timerify(this.backend.program.getTypeChecker);
    typeChecker();
  }

  private hasAcceptedExtension(filePath: string) {
    return this.extensions.has(extname(filePath));
  }

  public addEntryPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.entryPaths.add(filePath);
      this.projectPaths.add(filePath);
    }
  }

  public addEntryPaths(filePaths: Set<string> | string[]) {
    filePaths.forEach(filePath => this.addEntryPath(filePath));
  }

  public addProjectPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.projectPaths.add(filePath);
    }
  }

  public skipExportsAnalysisFor(filePaths: string[]) {
    filePaths.forEach(filePath => this.skipExportsAnalysis.add(filePath));
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

  public analyzeSourceFile(filePath: string, workspace: Workspace) {
    const sourceFile = this.backend.program?.getSourceFile(filePath);

    if (!sourceFile) throw new Error(`Unable to find ${filePath}`);

    const skipTypeOnly = !this.isReportTypes;
    const skipExports = this.skipExportsAnalysis.has(filePath);

    const { imports, exports, duplicateExports } = getImportsAndExports(sourceFile, workspace, {
      skipTypeOnly,
      skipExports,
    });

    const { internal, unresolved, external } = imports;

    const unresolvedImports: Set<string> = new Set();

    unresolved.forEach(specifier => {
      if (specifier.startsWith('http')) {
        // TODO Add to debug logs?
        return;
      }
      const resolvedModule = this.resolveModule(specifier, filePath);
      if (resolvedModule) {
        if (resolvedModule.isExternalLibraryImport) {
          external.add(specifier);
        } else {
          this.addEntryPath(resolvedModule.resolvedFileName);
        }
      } else {
        if (/^(@|[a-z])/.test(specifier)) {
          external.add(specifier);
        } else {
          const ext = extname(specifier);
          if (!ext || (ext !== '.json' && !IGNORED_FILE_EXTENSIONS.includes(ext))) {
            unresolvedImports.add(specifier);
          } else {
            // TODO Add to debug logs?
          }
        }
      }
    });

    return {
      imports: {
        internal,
        unresolved: unresolvedImports,
        external,
      },
      exports,
      duplicateExports,
    };
  }

  private resolveModule(specifier: string, filePath: string = specifier) {
    const module = ts.resolveModuleName(specifier, filePath, this.compilerOptions, this.backend.languageServiceHost);
    return module?.resolvedModule;
  }

  public hasExternalReferences(filePath: string, exportedItem: ExportItem) {
    const referencedSymbols = this.findReferences(filePath, exportedItem.node);
    const externalRefs = referencedSymbols.flatMap(f => f.references).filter(ref => ref.fileName !== filePath);
    return externalRefs.length > 0;
  }

  public findUnusedMembers(filePath: string, members: ExportItemMember[]) {
    return members
      .filter(member => {
        const referencedSymbols = this.findReferences(filePath, member.node);
        const files = referencedSymbols
          .flatMap(refs => refs.references)
          .filter(ref => !ref.isDefinition)
          .map(ref => ref.fileName);
        const internalRefs = files.filter(f => f === filePath);
        const externalRefs = files.filter(f => f !== filePath);
        return externalRefs.length === 0 && internalRefs.length === 0;
      })
      .map(member => member.identifier);
  }

  private findReferences(filePath: string, node: ts.Node) {
    return this.backend.lsFindReferences(filePath, node.getStart()) ?? [];
  }

  public isPublicExport(exportedItem: ExportItem) {
    return ts.getJSDocPublicTag(exportedItem.node);
  }
}
