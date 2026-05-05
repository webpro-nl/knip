import type { PackageJson } from '../types/package-json.ts';
import type { HostDependencies, InstalledBinaries } from '../types/workspace.ts';
import { isDefinitelyTyped } from '../util/modules.ts';
import { dirname, join } from '../util/path.ts';
import { timerify } from '../util/Performance.ts';
import { _require } from '../util/require.ts';
import { findPackageManifestPath, loadPackageManifest } from './helpers.ts';

export type ManifestCache = Map<string, PackageJson | null>;

type Options = {
  packageNames: string[];
  dir: string;
  cwd: string;
};

const getMetaDataFromPackageJson = ({ cwd, dir, packageNames }: Options) => {
  const hostDependencies: HostDependencies = new Map();

  // Find all binaries for each dependency
  const installedBinaries: InstalledBinaries = new Map();

  const hasTypesIncluded = new Set<string>();

  for (const packageName of packageNames) {
    const manifest = loadPackageManifest({ cwd, dir, packageName });
    if (manifest) {
      // Read and store installed binaries
      const binaryName = packageName.replace(/^@[^/]+\//, '');
      const binaries = typeof manifest.bin === 'string' ? [binaryName] : Object.keys(manifest.bin ?? {});
      for (const binaryName of binaries) {
        if (installedBinaries.has(binaryName)) {
          installedBinaries.get(binaryName)?.add(packageName);
        } else {
          installedBinaries.set(binaryName, new Set([packageName]));
        }
        if (installedBinaries.has(packageName)) {
          installedBinaries.get(packageName)?.add(binaryName);
        } else {
          installedBinaries.set(packageName, new Set([binaryName]));
        }
      }

      // Read and store peer dependencies
      const packagePeerDependencies = Object.keys(manifest.peerDependencies ?? {});
      for (const packagePeerDependency of packagePeerDependencies) {
        const hostDependency = {
          name: packageName,
          isPeerOptional: manifest.peerDependenciesMeta?.[packagePeerDependency]?.optional ?? false,
        };
        if (hostDependencies.has(packagePeerDependency)) {
          hostDependencies.get(packagePeerDependency)?.push(hostDependency);
        } else {
          hostDependencies.set(packagePeerDependency, [hostDependency]);
        }
      }

      if (!isDefinitelyTyped(packageName) && (manifest.types || manifest.typings)) hasTypesIncluded.add(packageName);
    }
  }

  return {
    hostDependencies,
    installedBinaries,
    hasTypesIncluded,
  };
};

const expandTransitivePeers = (
  { cwd, dir, packageNames }: Options,
  hostDependencies: HostDependencies,
  cache: ManifestCache
) => {
  const visit = (rootName: string, rootDir: string) => {
    const visited = new Set<string>([rootDir]);
    const stack = [rootDir];
    while (stack.length) {
      const pkgDir = stack.pop()!;
      let manifest = cache.get(pkgDir);
      if (manifest === undefined) {
        try {
          manifest = _require(join(pkgDir, 'package.json')) as PackageJson;
        } catch {
          manifest = null;
        }
        cache.set(pkgDir, manifest);
      }
      if (!manifest) continue;

      if (pkgDir !== rootDir && manifest.peerDependencies) {
        for (const peer in manifest.peerDependencies) {
          const list = hostDependencies.get(peer);
          const isPeerOptional = manifest.peerDependenciesMeta?.[peer]?.optional ?? false;
          if (!list) hostDependencies.set(peer, [{ name: rootName, isPeerOptional }]);
          else if (!list.some(e => e.name === rootName)) list.push({ name: rootName, isPeerOptional });
        }
      }

      const subs: string[] = [];
      if (manifest.dependencies) for (const sub in manifest.dependencies) subs.push(sub);
      if (manifest.optionalDependencies) for (const sub in manifest.optionalDependencies) subs.push(sub);
      for (const sub of subs) {
        const subPath = findPackageManifestPath(pkgDir, sub);
        if (!subPath) continue;
        const subDir = dirname(subPath);
        if (visited.has(subDir)) continue;
        visited.add(subDir);
        stack.push(subDir);
      }
    }
  };

  for (const packageName of packageNames) {
    const directPath = findPackageManifestPath(dir, packageName) ?? findPackageManifestPath(cwd, packageName);
    if (directPath) visit(packageName, dirname(directPath));
  }
};

export const getDependencyMetaData = timerify(getMetaDataFromPackageJson);
export const getTransitivePeerDependencies = timerify(expandTransitivePeers);
