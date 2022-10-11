import { Project } from 'ts-morph';
import type { SourceFile } from 'ts-morph';
import { resolvePaths } from './path';
import type { Configuration } from '../types';

export const createProject = async (configuration: Configuration, paths?: string[]) => {
  const { tsConfigFilePath, ignorePatterns } = configuration;
  const tsConfig = tsConfigFilePath ? { tsConfigFilePath } : { compilerOptions: { allowJs: true } };
  const workspace = new Project({
    ...tsConfig,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  if (paths) {
    const resolvedPaths = resolvePaths(configuration, paths);
    workspace.addSourceFilesAtPaths([...resolvedPaths, ...ignorePatterns]);
  }
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
