import { ProjectOptions } from 'ts-morph';
import { createProject } from '../../src/util/project';

export const createTestProject = ({
  workingDir,
  projectOptions,
  entryFiles,
  projectFiles,
}: {
  workingDir: string;
  projectOptions: ProjectOptions;
  entryFiles: string[];
  projectFiles: string[];
}) => {
  // Create workspace for entry files + resolved dependencies
  const production = createProject({
    workingDir,
    projectOptions,
    paths: entryFiles,
  });
  const _entryFiles = production.getSourceFiles();
  production.resolveSourceFileDependencies();
  const productionFiles = production.getSourceFiles();

  // Create workspace for the entire project
  const project = createProject({
    workingDir,
    projectOptions,
    paths: projectFiles,
  });
  const _projectFiles = project.getSourceFiles();

  return { entryFiles: _entryFiles, productionFiles, projectFiles: _projectFiles };
};
