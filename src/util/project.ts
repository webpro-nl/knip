import path from 'node:path';
import { Project } from 'ts-morph';
import type { SourceFile } from 'ts-morph';
import type { Configuration } from '../types';

const resolvePaths = (cwd: string, patterns: string | string[]) => {
  return [patterns].flat().map(pattern => {
    if (pattern.startsWith('!')) return '!' + path.join(cwd, pattern.slice(1));
    return path.join(cwd, pattern);
  });
};

export const createProject = async (configuration: Configuration, paths?: string | string[]) => {
  const { tsConfigFilePath, workingDir } = configuration;
  const tsConfig = tsConfigFilePath ? { tsConfigFilePath } : { compilerOptions: { allowJs: true } };
  const workspace = new Project({
    ...tsConfig,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  if (paths) workspace.addSourceFilesAtPaths(resolvePaths(workingDir, paths));
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
