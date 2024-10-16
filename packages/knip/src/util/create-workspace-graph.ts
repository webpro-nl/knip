import type { PackageJson } from '../types/package-json.js';
import { join } from './path.js';

interface Package {
  manifest: PackageJson;
  dir: string;
}

export type WorkspaceGraph = Record<string, Set<string>>;

const types = ['peerDependencies', 'devDependencies', 'optionalDependencies', 'dependencies'] as const;

export function createWorkspaceGraph(
  cwd: string,
  wsNames: string[],
  wsPkgNames: Set<string>,
  wsPackages: Map<string, Package>
) {
  const graph: WorkspaceGraph = {};

  const getWorkspaceDirs = (pkg: Package, name: string) => {
    const dirs = new Set<string>();
    for (const type of types) {
      if (pkg.manifest[type]) {
        for (const pkgName in pkg.manifest[type]) {
          if (wsPkgNames.has(pkgName)) {
            const wsPackage = wsPackages.get(name);
            if (wsPackage) dirs.add(wsPackage.dir);
          }
        }
      }
    }
    return dirs;
  };

  for (const name of wsNames) {
    const pkg = wsPackages.get(name);
    if (pkg) graph[join(cwd, name)] = getWorkspaceDirs(pkg, name);
  }

  return graph;
}
