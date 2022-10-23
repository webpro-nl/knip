import { Project } from 'ts-morph';
import type { ProjectOptions, SourceFile } from 'ts-morph';

export const createProject = (projectOptions: ProjectOptions, paths?: string[]) => {
  const project = new Project(projectOptions);
  if (paths) project.addSourceFilesAtPaths(paths);
  return project;
};

// Remove external source files from project
// This frees up memory from files that will not be used anyway, removed from endless debug output, and potentially
// problematic with alternative package managers, symlinks, and whatnot.
export const removeExternalSourceFiles = (project: Project) =>
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
