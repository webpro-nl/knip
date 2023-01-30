import path from 'node:path';
import { ts } from 'ts-morph';
import { debugLogSourceFiles } from './util/debug.js';
import { toPosixPath } from './util/path.js';
import {
  _createProject,
  partitionSourceFiles,
  _resolveSourceFileDependencies,
  _removeExternalSourceFiles,
} from './util/project.js';
import type { Project, ProjectOptions, SourceFile } from 'ts-morph';
import type { TsConfigJson } from 'type-fest';

// Kitchen sink TypeScript config
const baseCompilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
};

const skipAddFiles = { skipAddingFilesFromTsConfig: true, skipFileDependencyResolution: true };

/**
 * - Collects entry and project paths
 * - Collects and normalizes TS compilerOptions paths
 * - Creates two ts-morph projects for combined workspaces to settle un/used files
 */
export default class ProjectPrincipal {
  projectOptions?: ProjectOptions;
  tsConfigFilePath?: string;

  entryPaths: Set<string> = new Set();
  projectPaths: Set<string> = new Set();

  entryWorkspace?: Project;
  projectWorkspace?: Project;
  entryFiles?: SourceFile[];

  public addEntryPath(filePath: string) {
    this.entryPaths.add(filePath);
  }

  public addEntryPaths(filePaths: Set<string>) {
    filePaths.forEach(filePath => this.entryPaths.add(filePath));
  }

  public addSourceFile(filePath: string) {
    this.entryWorkspace?.addSourceFileAtPath(filePath);
  }

  public addProjectPath(filePath: string) {
    this.projectPaths.add(filePath);
  }

  public removeProjectPath(filePath: string) {
    this.projectPaths.delete(toPosixPath(filePath));
  }

  public addTypeScriptPaths(workspaceDir: string, compilerOptions: TsConfigJson['compilerOptions']) {
    if (!compilerOptions || !compilerOptions.paths) return;

    if (!this.projectOptions) this.projectOptions = {};
    if (!this.projectOptions.compilerOptions) this.projectOptions.compilerOptions = {};
    if (!this.projectOptions.compilerOptions.paths) this.projectOptions.compilerOptions.paths = {};

    const { baseUrl, paths } = compilerOptions;
    for (const [key, entries] of Object.entries(paths)) {
      const workspacePaths = entries.map(entry =>
        baseUrl ? path.join(workspaceDir, baseUrl, entry) : path.join(workspaceDir, entry)
      );
      if (this.projectOptions.compilerOptions.paths[key]) {
        this.projectOptions.compilerOptions.paths[key].push(...workspacePaths);
      } else {
        this.projectOptions.compilerOptions.paths[key] = workspacePaths;
      }
    }
  }

  public createProjects() {
    const compilerOptions = { ...baseCompilerOptions, ...this.projectOptions?.compilerOptions };
    this.projectOptions = this.tsConfigFilePath
      ? { tsConfigFilePath: this.tsConfigFilePath, compilerOptions }
      : { compilerOptions };

    // Create workspace for entry + resolved files (but don't resolve yet)
    this.entryWorkspace = _createProject({ ...this.projectOptions, ...skipAddFiles }, [...this.entryPaths]);
    this.entryFiles = this.entryWorkspace.getSourceFiles();
    debugLogSourceFiles(`Included entry files`, this.entryFiles);

    // Create workspace for the entire project
    this.projectWorkspace = _createProject({ ...this.projectOptions, ...skipAddFiles }, [...this.projectPaths]);
    const projectFiles = this.projectWorkspace.getSourceFiles();
    debugLogSourceFiles('Included project files', projectFiles);
  }

  public getResolvedFiles() {
    if (!this.entryWorkspace) return [];
    _resolveSourceFileDependencies(this.entryWorkspace);
    return _removeExternalSourceFiles(this.entryWorkspace);
  }

  public settleFiles() {
    const entryFiles = this.entryFiles;
    const projectFiles = this.projectWorkspace?.getSourceFiles();

    if (this.entryWorkspace && entryFiles && projectFiles) {
      const resolvedFiles = this.getResolvedFiles();
      debugLogSourceFiles(`Included files resolved from entry files`, resolvedFiles);

      const [usedResolvedFiles, unreferencedResolvedFiles] = partitionSourceFiles(projectFiles, resolvedFiles);
      const [usedEntryFiles, usedNonEntryFiles] = partitionSourceFiles(usedResolvedFiles, entryFiles);

      debugLogSourceFiles('Used files', usedResolvedFiles);
      debugLogSourceFiles('Unreferenced files', unreferencedResolvedFiles);
      debugLogSourceFiles('Used entry files', usedEntryFiles);
      debugLogSourceFiles('Used non-entry files', usedNonEntryFiles);

      return { usedResolvedFiles, unreferencedResolvedFiles };
    }

    const emptySet: Set<SourceFile> = new Set();

    return { usedResolvedFiles: emptySet, unreferencedResolvedFiles: emptySet };
  }
}
