import type { HostDependencies, InstalledBinaries } from '../types/workspace.ts';
import { isDefinitelyTyped } from '../util/modules.ts';
import { timerify } from '../util/Performance.ts';
import { loadPackageManifest } from './helpers.ts';

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

  const addBinary = (key: string, value: string) => {
    const set = installedBinaries.get(key);
    if (set) set.add(value);
    else installedBinaries.set(key, new Set([value]));
  };

  for (const packageName of packageNames) {
    const manifest = loadPackageManifest({ cwd, dir, packageName });
    if (manifest) {
      // Read and store installed binaries
      const defaultBinaryName = packageName.replace(/^@[^/]+\//, '');
      const binaries = typeof manifest.bin === 'string' ? [defaultBinaryName] : Object.keys(manifest.bin ?? {});
      for (const binaryName of binaries) {
        addBinary(binaryName, packageName);
        addBinary(packageName, binaryName);
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

export const getDependencyMetaData = timerify(getMetaDataFromPackageJson);
