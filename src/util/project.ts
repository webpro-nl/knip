import { Project } from 'ts-morph';
import {
  findDuplicateExportedNames,
  hasReferencingDefaultImport,
  findReferencingNamespaceNodes,
} from 'ts-morph-helpers';
import { timerify } from './performance.js';
import type { ProjectOptions, SourceFile, ReferenceFindableNode, ReferencedSymbol } from 'ts-morph';

const getExportedDeclarations = (sourceFile: SourceFile) => sourceFile.getExportedDeclarations();
const findReferences = (identifier?: ReferenceFindableNode) => identifier?.findReferences() ?? [];

const createProject = (projectOptions: ProjectOptions, paths?: string[]) => {
  const project = new Project(projectOptions);
  if (paths) paths.forEach(filePath => project.addSourceFileAtPathIfExists(filePath));
  return project;
};

const resolveSourceFileDependencies = (project: Project) => project.resolveSourceFileDependencies();

// Remove external source files from project
// This frees up memory from files that will not be used anyway, removed from endless debug output, and potentially
// problematic with alternative package managers, symlinks, and whatnot.
const removeExternalSourceFiles = (project: Project) =>
  project.getSourceFiles().filter(sourceFile => {
    const filePath = sourceFile.getFilePath();
    if (/\/node_modules\//.test(filePath)) {
      return !project.removeSourceFile(sourceFile);
    }
    return true;
  });

// Returns two sets from items in first argument: one with the intersection, another with the rest
export const partitionSourceFiles = (
  project: SourceFile[] | Set<SourceFile>,
  productionFiles: SourceFile[]
): [Set<SourceFile>, Set<SourceFile>] => {
  const productionFilePaths = productionFiles.map(sourceFile => sourceFile.getFilePath());
  const usedFiles: Set<SourceFile> = new Set();
  const unusedFiles: Set<SourceFile> = new Set();
  project.forEach(projectFile => {
    if (productionFilePaths.includes(projectFile.getFilePath())) {
      usedFiles.add(projectFile);
    } else {
      unusedFiles.add(projectFile);
    }
  });
  return [usedFiles, unusedFiles];
};

export const hasExternalReferences = (refs: ReferencedSymbol[], filePath: string) => {
  const refFiles = new Set(refs.map(r => r.compilerObject.references.map(r => r.fileName)).flat());
  return !(refFiles.size === 1 && [...refFiles][0] === filePath);
};

export const hasInternalReferences = (refs: ReferencedSymbol[]) => {
  return refs.map(ref => ref.getReferences()).flat().length > 1;
};

export const _createProject = timerify(createProject);

export const _resolveSourceFileDependencies = timerify(resolveSourceFileDependencies);

export const _removeExternalSourceFiles = timerify(removeExternalSourceFiles);

export const _findReferencingNamespaceNodes = timerify(findReferencingNamespaceNodes);

export const _hasReferencingDefaultImport = timerify(hasReferencingDefaultImport);

export const _findDuplicateExportedNames = timerify(findDuplicateExportedNames);

export const _getExportedDeclarations = timerify(getExportedDeclarations);

export const _findReferences = timerify(findReferences);
