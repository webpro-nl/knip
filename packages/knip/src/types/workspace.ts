export type DependencySet = Set<string>;
export type DependencyArray = Array<string>;

type WorkspaceManifest = {
  workspaceDir: string;
  manifestPath: string;
  manifestStr: string;
  dependencies: DependencyArray;
  devDependencies: DependencyArray;
  peerDependencies: DependencySet;
  optionalPeerDependencies: DependencyArray;
  allDependencies: DependencySet;
  ignoreDependencies: (string | RegExp)[];
  ignoreBinaries: (string | RegExp)[];
  ignoreUnresolved: (string | RegExp)[];
  usedIgnoreDependencies: Set<string | RegExp>;
  usedIgnoreBinaries: Set<string | RegExp>;
  usedIgnoreUnresolved: Set<string | RegExp>;
};

export type WorkspaceManifests = Map<string, WorkspaceManifest>;

export type HostDependencies = Map<string, Array<{ name: string; isPeerOptional: boolean }>>;

type PackageName = string;
type BinaryName = string;

export type InstalledBinaries = Map<PackageName, Set<BinaryName>>;
