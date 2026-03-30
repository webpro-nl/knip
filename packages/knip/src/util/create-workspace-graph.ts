import type { WorkspacePackage } from '../types/package-json.ts';
import { join } from './path.ts';

export type WorkspaceGraph = Map<string, Set<string>>;

const types = ['peerDependencies', 'devDependencies', 'optionalDependencies', 'dependencies'] as const;

export function createWorkspaceGraph(
  cwd: string,
  wsNames: string[],
  wsPkgNames: Set<string>,
  wsPackages: Map<string, WorkspacePackage>
) {
  const graph: WorkspaceGraph = new Map();

  const packagesByPkgName = new Map<string, WorkspacePackage>();
  for (const pkg of wsPackages.values()) if (pkg.pkgName) packagesByPkgName.set(pkg.pkgName, pkg);

  const getWorkspaceDirs = (pkg: WorkspacePackage) => {
    const dirs = new Set<string>();
    for (const type of types) {
      if (pkg.manifest[type]) {
        for (const pkgName in pkg.manifest[type]) {
          if (wsPkgNames.has(pkgName)) {
            const wsPackage = packagesByPkgName.get(pkgName);
            if (wsPackage) dirs.add(wsPackage.dir);
          }
        }
      }
    }
    return dirs;
  };

  for (const name of wsNames) {
    const pkg = wsPackages.get(name);
    if (pkg) graph.set(join(cwd, name), getWorkspaceDirs(pkg));
  }

  return graph;
}
