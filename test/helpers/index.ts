import { createRequire } from 'node:module';
import path from 'node:path';
import { ProjectOptions } from 'ts-morph';
import { PackageJson } from 'type-fest';
import { _createProject } from '../../src/util/project.js';

export const createTestProject = ({
  projectOptions,
  entryFiles,
  projectFiles,
}: {
  projectOptions: ProjectOptions;
  entryFiles: string[];
  projectFiles: string[];
}) => {
  // Create workspace for entry files + resolved dependencies
  const production = _createProject(projectOptions, entryFiles);
  const _entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const project = _createProject(projectOptions, projectFiles);
  const _projectFiles = project.getSourceFiles();

  return { entryFiles: _entryFiles, productionFiles, projectFiles: _projectFiles };
};

const require = createRequire(process.cwd());

export const getManifest = (cwd: string): PackageJson => require(path.join(cwd, 'package.json'));
