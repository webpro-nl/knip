type WorkspaceManifest = {
  workspaceDir: string;
  manifestPath: string;
  scripts: string[];
  dependencies: string[];
  peerDependencies: string[];
  optionalDependencies: string[];
  devDependencies: string[];
  allDependencies: string[];
  ignoreDependencies: string[];
  ignoreBinaries: string[];
};

export type WorkspaceManifests = Map<string, WorkspaceManifest>;

export type PeerDependencies = Map<string, Set<string>>;

export type InstalledBinaries = Map<string, Set<string>>;
