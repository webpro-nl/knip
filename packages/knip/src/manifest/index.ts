import type { HostDependencies, InstalledBinaries } from '../types/workspace.js';
import { timerify } from '../util/Performance.js';
import { isDefinitelyTyped } from '../util/modules.js';
import { loadPackageManifest } from './helpers.js';

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

export const getDependencyMetaData = timerify(getMetaDataFromPackageJson);
