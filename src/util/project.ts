import path from 'node:path';
import { Project } from 'ts-morph';
import { findFile } from './path';
import type { SourceFile } from 'ts-morph';

const resolvePaths = (cwd: string, patterns: string | string[]) => {
  return [patterns].flat().map(pattern => {
    if (pattern.startsWith('!')) return '!' + path.join(cwd, pattern.slice(1));
    return path.join(cwd, pattern);
  });
};

export const createProject = async (cwd: string, paths?: string | string[]) => {
  const tsConfigFilePath = await findFile(cwd, 'tsconfig.json');
  const workspace = new Project({
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  if (paths) workspace.addSourceFilesAtPaths(resolvePaths(cwd, paths));
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
