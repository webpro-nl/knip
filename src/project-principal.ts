import path from 'node:path';
import { ts } from 'ts-morph';
import { debugLogFiles, debugLogSourceFiles } from './util/debug.js';
import {
  _createProject,
  partitionSourceFiles,
  _resolveSourceFileDependencies,
  _removeExternalSourceFiles,
} from './util/project.js';
import type { ProjectOptions } from 'ts-morph';

// Kitchen sink TypeScript config
const compilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipDefaultLibCheck: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2015,
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
  projectOptions: ProjectOptions;

  tsConfigFilePath?: string;
  entryPaths: Set<string> = new Set();
  projectPaths: Set<string> = new Set();

  constructor() {
    this.projectOptions = this.tsConfigFilePath
      ? { tsConfigFilePath: this.tsConfigFilePath, compilerOptions }
      : { compilerOptions };
  }

  public addEntryPath(filePath: string) {
    this.entryPaths.add(filePath);
  }

  public addProjectPath(filePath: string) {
    this.projectPaths.add(filePath);
  }

  public addTypeScriptPaths(workspaceDir: string, paths: Record<string, string[]>) {
    for (const [key, entries] of Object.entries(paths)) {
      const workspacePaths = entries.map(entry => path.join(workspaceDir, entry));
      if (!this.projectOptions.compilerOptions) this.projectOptions.compilerOptions = {};
      if (!this.projectOptions.compilerOptions.paths) this.projectOptions.compilerOptions.paths = {};
      if (this.projectOptions.compilerOptions.paths[key]) {
        this.projectOptions.compilerOptions.paths[key].push(...workspacePaths);
      } else {
        this.projectOptions.compilerOptions.paths[key] = workspacePaths;
      }
    }
  }

  private createProjects() {
    const production = _createProject({ ...this.projectOptions, ...skipAddFiles }, [...this.entryPaths]);
    const entryFiles = production.getSourceFiles();
    debugLogSourceFiles(`Included entry files`, entryFiles);

    // Now resolve dependencies of entry files to find all production files
    _resolveSourceFileDependencies(production);
    const productionFiles = _removeExternalSourceFiles(production);
    debugLogSourceFiles('Included files resolved from entry files', productionFiles);

    // Create workspace for the entire project
    const project = _createProject({ ...this.projectOptions, ...skipAddFiles }, [...this.projectPaths]);
    const projectFiles = project.getSourceFiles();
    debugLogSourceFiles('Included project files', projectFiles);

    return { entryFiles, productionFiles, projectFiles };
  }

  public settleFiles() {
    const { entryFiles, productionFiles, projectFiles } = this.createProjects();
    // Slice & dice used & unreferenced files
    const [usedProductionFiles, unreferencedProductionFiles] = partitionSourceFiles(projectFiles, productionFiles);
    const [usedEntryFiles, usedNonEntryFiles] = partitionSourceFiles(usedProductionFiles, entryFiles);

    debugLogSourceFiles('Used production files', usedProductionFiles);
    debugLogFiles('Unreferenced production files', unreferencedProductionFiles);
    debugLogSourceFiles('Used entry files', usedEntryFiles);
    debugLogFiles('Used non-entry files', usedNonEntryFiles);

    return { usedProductionFiles, unreferencedProductionFiles };
  }
}
