type WorkspaceManifest = {
  workspaceDir: string;
  manifestPath: string;
  scripts: string[];
  dependencies: string[];
  peerDependencies: string[];
  optionalPeerDependencies: string[];
  optionalDependencies: string[];
  devDependencies: string[];
  allDependencies: string[];
  ignoreDependencies: string[];
  ignoreBinaries: string[];
};

export type WorkspaceManifests = Map<string, WorkspaceManifest>;

export type HostDependencies = Map<string, Set<{ name: string; isPeerOptional: boolean }>>;

export type InstalledBinaries = Map<string, Set<string>>;
