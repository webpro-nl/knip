import { _getDependenciesFromScripts } from '../binaries/index.js';
import { timerify } from '../util/Performance.js';
import { getPackageManifest } from './helpers.js';
import type { InstalledBinaries, PeerDependencies } from '../types/workspace.js';
import type { PackageJson } from '@npmcli/package-json';

type Options = {
  manifest: PackageJson;
  isProduction: boolean;
  isStrict: boolean;
  dir: string;
  cwd: string;
};

const findManifestDependencies = async ({ manifest, isProduction, isStrict, dir, cwd }: Options) => {
  const scriptFilter = isProduction ? ['start', 'postinstall'] : [];
  const peerDependencies: PeerDependencies = new Map();

  const scripts = Object.entries(manifest.scripts ?? {}).reduce((scripts, [scriptName, script]) => {
    if (script && (scriptFilter.length === 0 || scriptFilter.includes(scriptName))) {
      return [...scripts, script];
    }
    return scripts;
  }, [] as string[]);

  const dependencies = _getDependenciesFromScripts(scripts, { cwd: dir, manifest });

  // Find all binaries for each dependency
  const installedBinaries: InstalledBinaries = new Map();

  const packageNames = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...(isStrict ? Object.keys(manifest.peerDependencies ?? {}) : []),
    ...(isProduction ? [] : Object.keys(manifest.devDependencies ?? {})),
  ];

  for (const packageName of packageNames) {
    const manifest = await getPackageManifest({ dir, packageName, cwd });
    if (manifest) {
      // Read and store installed binaries
      const binaryName = packageName.replace(/^@[^/]+\//, '');
      const binaries = typeof manifest.bin === 'string' ? [binaryName] : Object.keys(manifest.bin ?? {});
      binaries.forEach(binaryName => {
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
      });

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

  return {
    dependencies,
    peerDependencies,
    installedBinaries,
  };
};

export const findDependencies = timerify(findManifestDependencies);
