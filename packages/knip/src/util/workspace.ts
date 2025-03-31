import type { Workspace } from '../ConfigurationChief.js';

// Paths sorter predicate function, starting with "root", ends with "the/deep/est/path"
export const byPathDepth = (a: string, b: string) => {
  const depthA = a.split('/');
  const depthB = b.split('/');
  if (depthA.length !== depthB.length) return depthA.length - depthB.length;
  if (depthA.includes('*') || depthA.includes('**')) return -1;
  if (depthB.includes('*') || depthB.includes('**')) return 1;
  return a.length - b.length;
};

// Topological sort of workspaces (edges first)
export const sortWorkspaces = (
  workspaceGraph: Map<string, Set<string>>,
  includedWorkspaces: Workspace[]
): Workspace[] => {
  const visited = new Set<string>();
  const sorted: Workspace[] = [];
  const visit = (workspace: Workspace): void => {
    if (visited.has(workspace.dir)) return;
    visited.add(workspace.dir);
    for (const dependency of workspaceGraph.get(workspace.dir) || new Set()) {
      const depWorkspace = includedWorkspaces.find(workspace => workspace.dir === dependency);
      if (depWorkspace) visit(depWorkspace);
    }
    sorted.push(workspace);
  };
  for (const workspace of includedWorkspaces) visit(workspace);
  return sorted;
};
