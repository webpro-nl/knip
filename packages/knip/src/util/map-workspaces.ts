import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import type { PackageJson, WorkspacePackage } from '../types/package-json.js';
import { partition } from './array.js';
import { debugLog } from './debug.js';
import { ConfigurationError } from './errors.js';
import { getPackageName } from './package-name.js';
import { join } from './path.js';

type Packages = Map<string, WorkspacePackage>;
type WorkspacePkgNames = Set<string>;

export default async function mapWorkspaces(cwd: string, workspaces: string[]): Promise<[Packages, WorkspacePkgNames]> {
  const [negatedPatterns, patterns] = partition(workspaces, p => p.match(/^!/));
  const packages: Packages = new Map();
  const wsPkgNames: WorkspacePkgNames = new Set();

  if (patterns.length === 0 && negatedPatterns.length === 0) return [packages, wsPkgNames];

  const matches = await fg.glob(patterns, {
    cwd,
    onlyDirectories: true,
    ignore: ['**/node_modules/**', ...negatedPatterns],
  });

  for (const name of matches) {
    const dir = join(cwd, name);
    const manifestPath = join(dir, 'package.json');
    try {
      const manifestStr = await readFile(manifestPath, 'utf8');
      const manifest: PackageJson = JSON.parse(manifestStr);
      const pkgName = getPackageName(manifest, dir);
      const pkg: WorkspacePackage = { dir, name, pkgName, manifestPath, manifestStr, manifest };
      packages.set(name, pkg);
      if (pkgName) wsPkgNames.add(pkgName);
      else throw new ConfigurationError(`Missing package name in ${manifestPath}`);
    } catch (error) {
      // @ts-expect-error
      if (error?.code === 'ENOENT') debugLog('*', `Unable to load package.json for ${name}`);
      else throw error;
    }
  }

  return [packages, wsPkgNames];
}
