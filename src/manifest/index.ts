import { getBinariesFromScripts } from '../util/binaries/index.js';
import { timerify } from '../util/performance.js';
import { getPackageManifest } from './helpers.js';
import type { Configuration } from '../types/config.js';
import type { InstalledBinaries, PeerDependencies } from '../types/workspace.js';
import type { PackageJson } from 'type-fest';

type Options = {
  rootConfig: Configuration;
  manifest: PackageJson;
  isRoot: boolean;
  isProduction: boolean;
  dir: string;
  cwd: string;
};

const findManifestDependencies = async ({ rootConfig, manifest, isRoot, isProduction, dir, cwd }: Options) => {
  const { ignoreBinaries } = rootConfig;
  const scriptFilter = isProduction ? ['start', 'postinstall'] : [];
  const referencedDependencies: Set<string> = new Set();
  const peerDependencies: PeerDependencies = new Map();

  const scripts = Object.entries(manifest.scripts ?? {}).reduce((scripts, [scriptName, script]) => {
    if (script && (scriptFilter.length === 0 || (scriptFilter.length > 0 && scriptFilter.includes(scriptName)))) {
      return [...scripts, script];
    }
    return scripts;
  }, [] as string[]);
  const referencedBinaries = getBinariesFromScripts(scripts, { manifest, ignore: rootConfig.ignoreBinaries });

  // Find all binaries for each dependency
  const installedBinaries: InstalledBinaries = new Map();
  const packageNames = [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})];
  for (const packageName of packageNames) {
    const manifest = await getPackageManifest(dir, packageName, isRoot, cwd);
    if (manifest) {
      // Read and store installed binaries
      const binaries = typeof manifest.bin === 'string' ? [packageName] : Object.keys(manifest.bin ?? {});
      binaries.forEach(binaryName => {
        if (installedBinaries.has(binaryName)) {
          installedBinaries.get(binaryName)?.add(packageName);
        } else {
          installedBinaries.set(binaryName, new Set([packageName]));
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

  for (const binaryName of referencedBinaries) {
    if (installedBinaries.has(binaryName)) {
      const packageNames = Array.from(installedBinaries.get(binaryName) ?? []);
      const packageName = packageNames.length === 1 ? packageNames[0] : undefined;
      referencedDependencies.add(packageName ?? binaryName);
    } else {
      referencedDependencies.add(binaryName);
    }
  }

  ignoreBinaries.forEach(binaryName => {
    const packageNames = installedBinaries.get(binaryName);
    packageNames?.forEach(packageName => referencedDependencies.add(packageName));
  });

  return {
    dependencies: Array.from(referencedDependencies),
    peerDependencies,
    installedBinaries,
  };
};

export const findDependencies = timerify(findManifestDependencies);
