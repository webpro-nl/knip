import { Project } from 'ts-morph';
import type { ProjectOptions, SourceFile } from 'ts-morph';

export const createProject = ({ projectOptions, paths }: { projectOptions: ProjectOptions; paths?: string[] }) => {
  const workspace = new Project({
    ...projectOptions,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  if (paths) workspace.addSourceFilesAtPaths(paths);
  return workspace;
};

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
