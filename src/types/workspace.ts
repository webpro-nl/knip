type WorkspaceManifest = {
  workspaceDir: string;
  manifestPath: string;
  scripts: string[];
  dependencies: string[];
  peerDependencies: string[];
  optionalDependencies: string[];
  devDependencies: string[];
  productionDependencies: string[];
  allDependencies: string[];
};

export type WorkspaceManifests = Map<string, WorkspaceManifest>;
