import { Project } from 'ts-morph';
import {
  findDuplicateExportedNames,
  hasReferencingDefaultImport,
  findReferencingNamespaceNodes,
} from 'ts-morph-helpers';
import { timerify } from './performance.js';
import type { ProjectOptions, SourceFile, Identifier } from 'ts-morph';

const getExportedDeclarations = (sourceFile: SourceFile) => sourceFile.getExportedDeclarations();
const findReferences = (identifier?: Identifier) => identifier?.findReferences() ?? [];

const createProject = (projectOptions: ProjectOptions, paths?: string[]) => {
  const project = new Project(projectOptions);
  if (paths) project.addSourceFilesAtPaths(paths);
  return project;
};

const resolveSourceFileDependencies = (project: Project) => project.resolveSourceFileDependencies();

// Remove external source files from project
// This frees up memory from files that will not be used anyway, removed from endless debug output, and potentially
// problematic with alternative package managers, symlinks, and whatnot.
const removeExternalSourceFiles = (project: Project) =>
  project.getSourceFiles().filter(sourceFile => {
    if (/\/node_modules\//.test(sourceFile.getFilePath())) {
      project.removeSourceFile(sourceFile);
      return false;
    }
    return true;
  });

// Returns two arrays from items in first argument: one with the intersection, another with the rest
export const partitionSourceFiles = (projectFiles: SourceFile[], productionFiles: SourceFile[]) => {
  const productionFilePaths = productionFiles.map(file => file.getFilePath());
  const usedFiles: SourceFile[] = [];
  const unusedFiles: SourceFile[] = [];
  projectFiles.forEach(projectFile => {
    if (productionFilePaths.includes(projectFile.getFilePath())) {
      usedFiles.push(projectFile);
    } else {
      unusedFiles.push(projectFile);
    }
  });
  return [usedFiles, unusedFiles];
};

export const _createProject = timerify(createProject);
export const _resolveSourceFileDependencies = timerify(resolveSourceFileDependencies);
export const _removeExternalSourceFiles = timerify(removeExternalSourceFiles);
export const _findReferencingNamespaceNodes = timerify(findReferencingNamespaceNodes);
export const _hasReferencingDefaultImport = timerify(hasReferencingDefaultImport);
export const _findDuplicateExportedNames = timerify(findDuplicateExportedNames);
export const _getExportedDeclarations = timerify(getExportedDeclarations);
export const _findReferences = timerify(findReferences);
