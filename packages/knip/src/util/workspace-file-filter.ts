import { join } from './path.js';

export const createWorkspaceFilePathFilter = (
  cwd: string,
  selectedWorkspaces: string[] | undefined,
  availableWorkspaceNames: string[] | undefined
) => {
  if (!selectedWorkspaces || !availableWorkspaceNames) return;

  const selected = new Set(selectedWorkspaces);
  const includeRoot = selected.has('.');

  const workspaceDirs = availableWorkspaceNames
    .filter(name => name !== '.')
    .map(name => ({ name, dir: join(cwd, name) }))
    .sort((a, b) => b.name.split('/').length - a.name.split('/').length);

  return (filePath: string) => {
    const match = workspaceDirs.find(ws => filePath.startsWith(`${ws.dir}/`));
    if (match) return selected.has(match.name);
    return includeRoot;
  };
};
