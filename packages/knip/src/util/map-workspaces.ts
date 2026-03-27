import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import type { PackageJson, WorkspacePackage } from '../types/package-json.ts';
import { partition } from './array.ts';
import { debugLog } from './debug.ts';
import { ConfigurationError } from './errors.ts';
import { parseYAML } from './fs.ts';
import { getPackageName } from './package-name.ts';
import { extname, join } from './path.ts';

type Packages = Map<string, WorkspacePackage>;
type WorkspacePkgNames = Set<string>;

const parseManifest = (manifestStr: string, manifestPath: string): PackageJson => {
  const ext = extname(manifestPath);
  if (ext === '.yaml' || ext === '.yml') return parseYAML(manifestStr);
  return JSON.parse(manifestStr);
};

export default async function mapWorkspaces(cwd: string, workspaces: string[]): Promise<[Packages, WorkspacePkgNames]> {
  const [negatedPatterns, patterns] = partition(workspaces, p => p.match(/^!/));
  const packages: Packages = new Map();
  const wsPkgNames: WorkspacePkgNames = new Set();

  if (patterns.length === 0 && negatedPatterns.length === 0) return [packages, wsPkgNames];

  const manifestPatterns = patterns.flatMap(p => [
    join(p, 'package.json'),
    join(p, 'package.yaml'),
    join(p, 'package.yml'),
  ]);

  const matches = await fg.glob(manifestPatterns, {
    cwd,
    ignore: ['**/node_modules/**', ...negatedPatterns.map(p => p.slice(1))],
  });

  const matchesByDir = new Map<string, string[]>();
  for (const match of matches) {
    const dirPath = match.replace(/(^|\/)package\.(json|yaml|yml)$/, '');
    const dirMatches = matchesByDir.get(dirPath);
    if (dirMatches) dirMatches.push(match);
    else matchesByDir.set(dirPath, [match]);
  }

  for (const [dirPath, dirMatches] of matchesByDir) {
    const packageJson = dirPath ? join(dirPath, 'package.json') : 'package.json';
    const match = dirMatches.includes(packageJson) ? packageJson : dirMatches.slice().sort()[0];
    if (!match) continue;
    const name = dirPath === '' ? '.' : dirPath;
    const dir = join(cwd, name);
    const manifestPath = join(cwd, match);
    try {
      const manifestStr = await readFile(manifestPath, 'utf8');
      const manifest: PackageJson = parseManifest(manifestStr, manifestPath);
      const pkgName = getPackageName(manifest, dir);
      const pkg: WorkspacePackage = { dir, name, pkgName, manifestPath, manifestStr, manifest };
      packages.set(name, pkg);
      if (pkgName) wsPkgNames.add(pkgName);
      else throw new ConfigurationError(`Missing package name in ${manifestPath}`);
    } catch (error) {
      // @ts-expect-error
      if (error?.code === 'ENOENT') debugLog('*', `Unable to load package manifest for ${name}`);
      else throw error;
    }
  }

  return [packages, wsPkgNames];
}
