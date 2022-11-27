import { PackageJson } from 'type-fest';
import { IGNORED_GLOBAL_BINARIES } from '../constants.js';
import { compact } from '../util/array.js';
import { timerify } from '../util/performance.js';
import { getBinariesFromScripts, getPackageManifest } from './helpers.js';

const findManifestDependencies = async (
  ignoreBinaries: string[],
  manifest: PackageJson,
  isRoot: boolean,
  dir: string,
  cwd: string
) => {
  const referencedDependencies: Set<string> = new Set();
  const peerDependencies: Map<string, Set<string>> = new Map();

  const scripts = compact(Object.values(manifest.scripts ?? {}));
  const referencedBinaries = getBinariesFromScripts(scripts)
    .filter(binaryName => !IGNORED_GLOBAL_BINARIES.includes(binaryName))
    .filter(binaryName => !ignoreBinaries.includes(binaryName));

  // Find all binaries for each dependency
  const installedBinaries: Map<string, string> = new Map();
  const deps = [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})];
  for (const packageName of deps) {
    const manifest = await getPackageManifest(dir, packageName, isRoot, cwd);
    if (manifest) {
      // Read and store installed binaries
      const binaries = typeof manifest.bin === 'string' ? [packageName] : Object.keys(manifest.bin ?? {});
      binaries.forEach(binaryName => installedBinaries.set(binaryName, packageName));

      // Read and store peer dependencies
      const packagePeerDependencies = Object.keys(manifest.peerDependencies ?? {});
      packagePeerDependencies.forEach(packagePeerDependency => {
        if (peerDependencies.has(packagePeerDependency)) {
          peerDependencies.get(packagePeerDependency)?.add(packageName);
        } else {
          peerDependencies.set(packagePeerDependency, new Set([packageName]));
        }
      });
    }
  }

  for (const binaryName of referencedBinaries) {
    const packageName = installedBinaries.get(binaryName);
    referencedDependencies.add(packageName ?? binaryName);
  }

  return {
    dependencies: Array.from(referencedDependencies),
    peerDependencies,
    installedBinaries,
  };
};

export const findDependencies = timerify(findManifestDependencies);
