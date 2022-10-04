import path from 'node:path';
import { ts, Project } from 'ts-morph';
import type { SourceFile, ExportedDeclarations } from 'ts-morph';

export const createProject = (cwd: string, paths?: string | string[]) => {
  const workspace = new Project({
    tsConfigFilePath: path.join(cwd, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true
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

export const isType = (declaration: ExportedDeclarations) =>
  declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
  declaration.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
  declaration.isKind(ts.SyntaxKind.EnumDeclaration);

export const getType = (declaration: ExportedDeclarations) => {
  if (declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration)) return 'type';
  if (declaration.isKind(ts.SyntaxKind.InterfaceDeclaration)) return 'interface';
  if (declaration.isKind(ts.SyntaxKind.EnumDeclaration)) return 'enum';
};
