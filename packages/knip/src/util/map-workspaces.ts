import fg from 'fast-glob';
import type { Package, PackageJson } from '../types/package-json.js';
import { partition } from './array.js';
import { debugLog } from './debug.js';
import { ConfigurationError } from './errors.js';
import { getPackageName } from './package-name.js';
import { join } from './path.js';
import { _require } from './require.js';

type Packages = Map<string, Package>;
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
    const filePath = join(dir, 'package.json');
    try {
      const manifest: PackageJson = _require(filePath);
      const pkgName = getPackageName(manifest, dir);
      const pkg: Package = { dir, name, pkgName, manifest };
      packages.set(name, pkg);
      if (pkgName) wsPkgNames.add(pkgName);
      else throw new ConfigurationError(`Missing package name in ${filePath}`);
    } catch (error) {
      // @ts-expect-error
      if (error?.code === 'MODULE_NOT_FOUND') debugLog('*', `Unable to load package.json for ${name}`);
      else throw error;
    }
  }

  return [packages, wsPkgNames];
}
