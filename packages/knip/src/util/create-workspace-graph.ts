import type { WorkspacePackage } from '../types/package-json.js';
import { join } from './path.js';

export type WorkspaceGraph = Record<string, Set<string>>;

const types = ['peerDependencies', 'devDependencies', 'optionalDependencies', 'dependencies'] as const;

export function createWorkspaceGraph(
  cwd: string,
  wsNames: string[],
  wsPkgNames: Set<string>,
  wsPackages: Map<string, WorkspacePackage>
) {
  const graph: WorkspaceGraph = {};

  const packages = Array.from(wsPackages.values());

  const getWorkspaceDirs = (pkg: WorkspacePackage) => {
    const dirs = new Set<string>();
    for (const type of types) {
      if (pkg.manifest[type]) {
        for (const pkgName in pkg.manifest[type]) {
          if (wsPkgNames.has(pkgName)) {
            const wsPackage = packages.find(pkg => pkg.pkgName === pkgName);
            if (wsPackage) dirs.add(wsPackage.dir);
          }
        }
      }
    }
    return dirs;
  };

  for (const name of wsNames) {
    const pkg = wsPackages.get(name);
    if (pkg) graph[join(cwd, name)] = getWorkspaceDirs(pkg);
  }

  return graph;
}
