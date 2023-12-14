import ts from 'typescript';
import { DEFAULT_EXTENSIONS } from './constants.js';
import { IGNORED_FILE_EXTENSIONS } from './constants.js';
import { createHosts } from './typescript/createHosts.js';
import { _getImportsAndExports } from './typescript/getImportsAndExports.js';
import { createCustomModuleResolver } from './typescript/resolveModuleNames.js';
import { SourceFileManager } from './typescript/SourceFileManager.js';
import { compact } from './util/array.js';
import { isStartsLikePackageName, sanitizeSpecifier } from './util/modules.js';
import { dirname, extname, isInNodeModules, join } from './util/path.js';
import { timerify } from './util/Performance.js';
import type { PrincipalOptions } from './PrincipalFactory.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';
import type { UnresolvedImport } from './types/imports.js';
import type { BoundSourceFile, GetResolvedModule, ProgramMaybe53 } from './typescript/SourceFile.js';
import type { GlobbyFilterFunction } from 'globby';

// These compiler options override local options
const baseCompilerOptions = {
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
  types: ['node'],
  noEmit: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  sourceMap: false,
};

const tsCreateProgram = timerify(ts.createProgram);

type AnalyzeSourceFileOptions = {
  skipTypeOnly: boolean;
  isFixExports: boolean;
  isFixTypes: boolean;
  ignoreExportsUsedInFile: boolean;
};

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

  // We don't want to report unused exports of config/plugin entry files
  skipExportsAnalysis = new Set<string>();

  isGitIgnored: GlobbyFilterFunction;
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  extensions: Set<string>;
  syncCompilers: SyncCompilers;
  asyncCompilers: AsyncCompilers;

  backend: {
    fileManager: SourceFileManager;
    compilerHost: ts.CompilerHost;
    resolveModuleNames: ReturnType<typeof createCustomModuleResolver>;
    program?: ProgramMaybe53;
    typeChecker?: ts.TypeChecker;
  };

  constructor({ compilerOptions, cwd, compilers, isGitIgnored }: PrincipalOptions) {
    this.cwd = cwd;

    this.isGitIgnored = isGitIgnored;

    this.compilerOptions = {
      ...compilerOptions,
      ...baseCompilerOptions,
      types: compact([...(compilerOptions.types ?? []), ...baseCompilerOptions.types]),
      allowNonTsExtensions: true,
    };

    const [syncCompilers, asyncCompilers] = compilers;
    this.extensions = new Set([...DEFAULT_EXTENSIONS, ...syncCompilers.keys(), ...asyncCompilers.keys()]);
    this.syncCompilers = syncCompilers;
    this.asyncCompilers = asyncCompilers;

    const { fileManager, compilerHost, resolveModuleNames } = createHosts({
      cwd: this.cwd,
      compilerOptions: this.compilerOptions,
      entryPaths: this.entryPaths,
      compilers: [this.syncCompilers, this.asyncCompilers],
    });

    this.backend = {
      fileManager,
      compilerHost,
      resolveModuleNames,
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
    filePaths.forEach(filePath => this.addEntryPath(filePath, options));
  }

  public addProjectPath(filePath: string) {
    if (!isInNodeModules(filePath) && this.hasAcceptedExtension(filePath)) {
      this.projectPaths.add(filePath);
    }
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

  public analyzeSourceFile(filePath: string, options: AnalyzeSourceFileOptions) {
    // We request it from `fileManager` directly as `program` does not contain cross-referenced files
    const sourceFile: BoundSourceFile | undefined = this.backend.fileManager.getSourceFile(filePath);

    if (!sourceFile) throw new Error(`Unable to find ${filePath}`);

    const skipExports = this.skipExportsAnalysis.has(filePath);

    const getResolvedModule: GetResolvedModule = specifier =>
      this.backend.program?.getResolvedModule
        ? this.backend.program.getResolvedModule(sourceFile, specifier, /* mode */ undefined)
        : sourceFile.resolvedModules?.get(specifier, /* mode */ undefined);

    const { imports, exports, scripts } = _getImportsAndExports(
      sourceFile,
      getResolvedModule,
      this.backend.typeChecker!,
      { ...options, skipExports }
    );

    const { internal, unresolved, external } = imports;

    const unresolvedImports = new Set<UnresolvedImport>();

    unresolved.forEach(unresolvedImport => {
      const { specifier } = unresolvedImport;
      if (specifier.startsWith('http')) {
        // Ignore Deno style http import specifiers.
        return;
      }
      const resolvedModule = this.resolveModule(specifier, filePath);
      if (resolvedModule) {
        if (resolvedModule.isExternalLibraryImport) {
          const sanitizedSpecifier = sanitizeSpecifier(specifier);
          external.add(sanitizedSpecifier);
        } else {
          const isIgnored = this.isGitIgnored(resolvedModule.resolvedFileName);
          if (!isIgnored) this.addEntryPath(resolvedModule.resolvedFileName, { skipExportsAnalysis: true });
        }
      } else {
        const sanitizedSpecifier = sanitizeSpecifier(specifier);
        if (isStartsLikePackageName(sanitizedSpecifier)) {
          // Should never end up here; maybe a dependency that was not installed.
          external.add(sanitizedSpecifier);
        } else {
          const isIgnored = this.isGitIgnored(join(dirname(filePath), sanitizedSpecifier));
          if (!isIgnored) {
            const ext = extname(sanitizedSpecifier);
            const hasIgnoredExtension = IGNORED_FILE_EXTENSIONS.has(ext);
            if (!ext || (ext !== '.json' && !hasIgnoredExtension)) {
              unresolvedImports.add(unresolvedImport);
            }
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
      scripts,
    };
  }

  public resolveModule(specifier: string, filePath: string = specifier) {
    return this.backend.resolveModuleNames([specifier], filePath)[0];
  }
}
