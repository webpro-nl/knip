import { isBuiltin } from 'node:module';
import type { Workspace } from './ConfigurationChief.js';
import {
  IGNORED_DEPENDENCIES,
  IGNORED_GLOBAL_BINARIES,
  IGNORED_RUNTIME_DEPENDENCIES,
  IGNORE_DEFINITELY_TYPED,
  ROOT_WORKSPACE_NAME,
} from './constants.js';
import { getDependencyMetaData } from './manifest/index.js';
import type { ConfigurationHints, Issue } from './types/issues.js';
import type { PackageJson } from './types/package-json.js';
import type {
  DependencyArray,
  DependencySet,
  HostDependencies,
  InstalledBinaries,
  WorkspaceManifests,
} from './types/workspace.js';
import { getDefinitelyTypedFor, getPackageFromDefinitelyTyped, isDefinitelyTyped } from './util/modules.js';
import { hasMatch, hasMatchInSet, toRegexOrString } from './util/regex.js';

type Options = {
  isProduction: boolean;
  isStrict: boolean;
};

/**
 * - Stores manifests
 * - Stores referenced external dependencies
 * - Stores binaries and peer dependencies
 * - Settles dependency issues
 * - Provides configuration hints
 */
export class DependencyDeputy {
  isProduction;
  isStrict;
  _manifests: WorkspaceManifests = new Map();
  referencedDependencies: Map<string, Set<string>>;
  referencedBinaries: Map<string, Set<string>>;
  hostDependencies: Map<string, HostDependencies>;
  installedBinaries: Map<string, InstalledBinaries>;
  hasTypesIncluded: Map<string, Set<string>>;

  constructor({ isProduction, isStrict }: Options) {
    this.isProduction = isProduction;
    this.isStrict = isStrict;
    this.referencedDependencies = new Map();
    this.referencedBinaries = new Map();
    this.hostDependencies = new Map();
    this.installedBinaries = new Map();
    this.hasTypesIncluded = new Map();
  }

  public addWorkspace({
    name,
    cwd,
    dir,
    manifestPath,
    manifest,
    ignoreDependencies,
    ignoreBinaries,
  }: {
    name: string;
    cwd: string;
    dir: string;
    manifestPath: string;
    manifest: PackageJson;
    ignoreDependencies: (string | RegExp)[];
    ignoreBinaries: (string | RegExp)[];
  }) {
    const dependencies = Object.keys(manifest.dependencies ?? {});
    const peerDependencies = Object.keys(manifest.peerDependencies ?? {});
    const optionalDependencies = Object.keys(manifest.optionalDependencies ?? {});
    const optionalPeerDependencies = manifest.peerDependenciesMeta
      ? peerDependencies.filter(
          peerDependency =>
            manifest.peerDependenciesMeta &&
            peerDependency in manifest.peerDependenciesMeta &&
            manifest.peerDependenciesMeta[peerDependency].optional
        )
      : [];
    const devDependencies = Object.keys(manifest.devDependencies ?? {});
    const allDependencies = [...dependencies, ...devDependencies, ...peerDependencies, ...optionalDependencies];

    const packageNames = [
      ...dependencies,
      ...(this.isStrict ? peerDependencies : []),
      ...(this.isProduction ? [] : devDependencies),
    ];

    const { hostDependencies, installedBinaries, hasTypesIncluded } = getDependencyMetaData({
      packageNames,
      dir,
      cwd,
    });

    this.setHostDependencies(name, hostDependencies);
    this.setInstalledBinaries(name, installedBinaries);
    this.setHasTypesIncluded(name, hasTypesIncluded);

    this._manifests.set(name, {
      workspaceDir: dir,
      manifestPath,
      ignoreDependencies: ignoreDependencies.map(toRegexOrString),
      ignoreBinaries: ignoreBinaries.map(toRegexOrString),
      dependencies,
      devDependencies,
      peerDependencies: new Set(peerDependencies),
      optionalPeerDependencies,
      allDependencies: new Set(allDependencies),
    });
  }

  getWorkspaceManifest(workspaceName: string) {
    return this._manifests.get(workspaceName);
  }

  getProductionDependencies(workspaceName: string): DependencyArray {
    const manifest = this._manifests.get(workspaceName);
    if (!manifest) return [];
    if (this.isStrict) return [...manifest.dependencies, ...manifest.peerDependencies];
    return manifest.dependencies;
  }

  getDevDependencies(workspaceName: string): DependencyArray {
    return this._manifests.get(workspaceName)?.devDependencies ?? [];
  }

  getDependencies(workspaceName: string): DependencySet {
    const manifest = this._manifests.get(workspaceName);
    if (!manifest) return new Set();
    return new Set([...manifest.dependencies, ...manifest.devDependencies]);
  }

  setInstalledBinaries(workspaceName: string, installedBinaries: Map<string, Set<string>>) {
    this.installedBinaries.set(workspaceName, installedBinaries);
  }

  getInstalledBinaries(workspaceName: string) {
    return this.installedBinaries.get(workspaceName);
  }

  setHasTypesIncluded(workspaceName: string, hasTypesIncluded: Set<string>) {
    this.hasTypesIncluded.set(workspaceName, hasTypesIncluded);
  }

  getHasTypesIncluded(workspaceName: string) {
    return this.installedBinaries.get(workspaceName);
  }

  addReferencedDependency(workspaceName: string, packageName: string) {
    if (!this.referencedDependencies.has(workspaceName)) {
      this.referencedDependencies.set(workspaceName, new Set());
    }
    this.referencedDependencies.get(workspaceName)?.add(packageName);
  }

  addReferencedBinary(workspaceName: string, binaryName: string) {
    if (!this.referencedBinaries.has(workspaceName)) {
      this.referencedBinaries.set(workspaceName, new Set());
    }
    this.referencedBinaries.get(workspaceName)?.add(binaryName);
  }

  setHostDependencies(workspaceName: string, hostDependencies: HostDependencies) {
    this.hostDependencies.set(workspaceName, hostDependencies);
  }

  getHostDependenciesFor(workspaceName: string, dependency: string) {
    return this.hostDependencies.get(workspaceName)?.get(dependency) ?? [];
  }

  getPeerDependencies(workspaceName: string): DependencySet {
    const manifest = this._manifests.get(workspaceName);
    if (!manifest) return new Set();
    return manifest.peerDependencies;
  }

  getOptionalPeerDependencies(workspaceName: string): DependencyArray {
    const manifest = this._manifests.get(workspaceName);
    if (!manifest) return [];
    return manifest.optionalPeerDependencies;
  }

  isIgnoredDependency(workspaceName: string, packageName: string): boolean {
    const manifest = this.getWorkspaceManifest(workspaceName);
    if (manifest && hasMatch(manifest.ignoreDependencies, packageName)) return true;
    if (workspaceName !== ROOT_WORKSPACE_NAME) return this.isIgnoredDependency(ROOT_WORKSPACE_NAME, packageName);
    return false;
  }

  isIgnoredBinary(workspaceName: string, binaryName: string): boolean {
    const manifest = this.getWorkspaceManifest(workspaceName);
    if (manifest && hasMatch(manifest.ignoreBinaries, binaryName)) return true;
    if (workspaceName !== ROOT_WORKSPACE_NAME) return this.isIgnoredBinary(ROOT_WORKSPACE_NAME, binaryName);
    return false;
  }

  /**
   * Returns `true` to indicate the external dependency has been handled properly. When `false`, the call-site probably
   * wants to mark the dependency as "unlisted".
   */
  public maybeAddReferencedExternalDependency(workspace: Workspace, packageName: string): boolean {
    if (isBuiltin(packageName)) return true;
    if (IGNORED_RUNTIME_DEPENDENCIES.has(packageName)) return true;

    // Ignore self-referenced imports
    if (packageName === workspace.pkgName) return true;

    const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...[...workspace.ancestors].reverse()];
    const closestWorkspaceName = workspaceNames.find(name => this.isInDependencies(name, packageName));

    // Prevent false positives by also marking the `@types/packageName` dependency as referenced
    const typesPackageName = !isDefinitelyTyped(packageName) && getDefinitelyTypedFor(packageName);
    const closestWorkspaceNameForTypes =
      typesPackageName && workspaceNames.find(name => this.isInDependencies(name, typesPackageName));

    if (closestWorkspaceName || closestWorkspaceNameForTypes) {
      closestWorkspaceName && this.addReferencedDependency(closestWorkspaceName, packageName);
      closestWorkspaceNameForTypes && this.addReferencedDependency(closestWorkspaceNameForTypes, typesPackageName);
      return true;
    }
    this.addReferencedDependency(workspace.name, packageName);

    if (this.isIgnoredDependency(workspace.name, packageName)) return true;

    return false;
  }

  public maybeAddReferencedBinary(workspace: Workspace, binaryName: string): boolean {
    if (IGNORED_GLOBAL_BINARIES.has(binaryName)) return true;

    this.addReferencedBinary(workspace.name, binaryName);

    const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...[...workspace.ancestors].reverse()];

    for (const name of workspaceNames) {
      const binaries = this.getInstalledBinaries(name);
      if (binaries?.has(binaryName)) {
        const dependencies = binaries.get(binaryName);
        if (dependencies?.size) {
          for (const dependency of dependencies) this.addReferencedDependency(name, dependency);
          return true;
        }
      }
    }

    if (this.isIgnoredBinary(workspace.name, binaryName)) return true;

    return false;
  }

  private isInDependencies(workspaceName: string, packageName: string) {
    const manifest = this._manifests.get(workspaceName);
    if (!manifest) return false;
    if (this.isStrict) return this.getProductionDependencies(workspaceName).includes(packageName);
    return manifest.allDependencies.has(packageName);
  }

  public settleDependencyIssues() {
    const dependencyIssues: Issue[] = [];
    const devDependencyIssues: Issue[] = [];
    const optionalPeerDependencyIssues: Issue[] = [];

    for (const [workspaceName, { manifestPath }] of this._manifests.entries()) {
      const referencedDependencies = this.referencedDependencies.get(workspaceName);
      const installedBinaries = this.getInstalledBinaries(workspaceName);
      const hasTypesIncluded = this.getHasTypesIncluded(workspaceName);

      const isNotIgnoredDependency = (packageName: string) => {
        if (this.isIgnoredDependency(workspaceName, packageName)) return false;
        return !IGNORED_DEPENDENCIES.has(packageName);
      };

      const isNotIgnoredBinary = (packageName: string) => {
        if (installedBinaries?.has(packageName)) {
          const binaryNames = installedBinaries.get(packageName);
          if (binaryNames) {
            for (const b of binaryNames) {
              if (this.isIgnoredBinary(workspaceName, b)) return false;
              if (IGNORED_GLOBAL_BINARIES.has(b)) return false;
            }
          }
        }
        return true;
      };

      // Keeping track of peer dependency recursions to prevent infinite loops for circularly referenced peer deps
      const peerDepRecs: Record<string, number> = {};

      const isReferencedDependency = (dependency: string, isPeerDep?: boolean): boolean => {
        // Is referenced, ignore
        if (referencedDependencies?.has(dependency)) return true;

        // Returning peer dependency, ignore
        if (isPeerDep && peerDepRecs[dependency]) return false;

        const [scope, typedDependency] = dependency.split('/');
        if (scope === '@types') {
          // The `pkg` dependency already has types included, i.e. this `@types/pkg` is obsolete
          if (hasTypesIncluded?.has(typedDependency)) return false;

          const typedPackageName = getPackageFromDefinitelyTyped(typedDependency);
          // Ignore `@types/*` packages that don't have a related dependency (e.g. `@types/node`)
          if (IGNORE_DEFINITELY_TYPED.includes(typedPackageName)) return true;

          // Ignore typed dependencies that have a host dependency that's referenced
          // Example: `next` (host) has `react-dom` and/or `@types/react-dom` (peer), peers can be ignored if host `next` is referenced
          const hostDependencies = [
            ...this.getHostDependenciesFor(workspaceName, dependency),
            ...this.getHostDependenciesFor(workspaceName, typedPackageName),
          ];
          if (hostDependencies.length) return !!hostDependencies.find(host => isReferencedDependency(host.name, true));

          if (!referencedDependencies) return false;

          return referencedDependencies.has(typedPackageName);
        }

        // A dependency may not be referenced, but it may be a peer dep of another.
        // If that host is also not referenced we'll report this dependency as unused.
        // Except if the host has this dependency as an optional peer dep itself.
        const hostDependencies = this.getHostDependenciesFor(workspaceName, dependency);

        for (const { name } of hostDependencies) {
          if (!peerDepRecs[name]) peerDepRecs[name] = 1;
          else peerDepRecs[name]++;
        }

        return hostDependencies.some(
          hostDependency =>
            (isPeerDep === false || !hostDependency.isPeerOptional) && isReferencedDependency(hostDependency.name, true)
        );
      };

      const isNotReferencedDependency = (dependency: string): boolean => !isReferencedDependency(dependency, false);

      const pd = this.getProductionDependencies(workspaceName);
      const dd = this.getDevDependencies(workspaceName);
      const od = this.getOptionalPeerDependencies(workspaceName);

      // biome-ignore lint/complexity/noForEach: TODO
      pd.filter(isNotIgnoredDependency)
        .filter(isNotIgnoredBinary)
        .filter(isNotReferencedDependency)
        .forEach(symbol => dependencyIssues.push({ type: 'dependencies', filePath: manifestPath, symbol }));

      // biome-ignore lint/complexity/noForEach: TODO
      dd.filter(isNotIgnoredDependency)
        .filter(isNotIgnoredBinary)
        .filter(isNotReferencedDependency)
        .forEach(symbol => devDependencyIssues.push({ type: 'devDependencies', filePath: manifestPath, symbol }));

      // biome-ignore lint/complexity/noForEach: TODO
      od.filter(isNotIgnoredDependency)
        .filter(isNotIgnoredBinary)
        .filter(p => isReferencedDependency(p))
        .forEach(symbol =>
          optionalPeerDependencyIssues.push({ type: 'optionalPeerDependencies', filePath: manifestPath, symbol })
        );
    }

    return { dependencyIssues, devDependencyIssues, optionalPeerDependencyIssues };
  }

  public getConfigurationHints() {
    const configurationHints: ConfigurationHints = new Set();

    const allDependencies = new Set<string>();
    const allPeerDependencies = new Set<string>();
    const allReferencedDependencies = new Set<string>();
    const allReferencedBinaries = new Set<string>();
    const allInstalledBinaryNames = new Set<string>();

    for (const [workspaceName, { ignoreDependencies, ignoreBinaries }] of this._manifests.entries()) {
      const dependencies = this.getDependencies(workspaceName);
      const peerDependencies = this.getPeerDependencies(workspaceName);
      const referencedDependencies = this.referencedDependencies.get(workspaceName) ?? new Set();
      const referencedBinaries = this.referencedBinaries.get(workspaceName) ?? new Set();
      const installedBinaries = this.getInstalledBinaries(workspaceName) ?? new Set<string>();
      const installedBinaryNames = new Set<string>(installedBinaries.keys());

      for (const id of dependencies) allDependencies.add(id);
      for (const id of peerDependencies) allPeerDependencies.add(id);
      for (const id of referencedDependencies) allReferencedDependencies.add(id);
      for (const id of referencedBinaries) allReferencedBinaries.add(id);
      for (const id of installedBinaryNames) allInstalledBinaryNames.add(id);

      if (workspaceName === ROOT_WORKSPACE_NAME) continue;

      for (const identifier of ignoreDependencies) {
        const isListed = hasMatchInSet(dependencies, identifier) && !hasMatchInSet(peerDependencies, identifier);
        const isReferenced = hasMatchInSet(referencedDependencies, identifier);
        if (typeof identifier === 'string' && isListed && isReferenced) {
          configurationHints.add({ workspaceName, identifier, type: 'ignoreDependencies' });
        } else if (!this.isProduction && !isListed && !isReferenced) {
          configurationHints.add({ workspaceName, identifier, type: 'ignoreDependencies' });
        }
      }

      for (const identifier of ignoreBinaries) {
        const isInstalled = hasMatchInSet(installedBinaryNames, identifier);
        const isReferenced = hasMatchInSet(referencedBinaries, identifier);
        if (typeof identifier === 'string' && isInstalled && isReferenced) {
          configurationHints.add({ workspaceName, identifier, type: 'ignoreBinaries' });
        } else if (!this.isProduction && !isInstalled && !isReferenced) {
          configurationHints.add({ workspaceName, identifier, type: 'ignoreBinaries' });
        }
      }
    }

    const manifest = this.getWorkspaceManifest(ROOT_WORKSPACE_NAME);
    if (manifest) {
      for (const identifier of manifest.ignoreDependencies) {
        const isListed = hasMatchInSet(allDependencies, identifier) && !hasMatchInSet(allPeerDependencies, identifier);
        const isReferenced = hasMatchInSet(allReferencedDependencies, identifier);
        if (typeof identifier === 'string' && !isDefinitelyTyped(identifier) && isListed && isReferenced) {
          configurationHints.add({ workspaceName: ROOT_WORKSPACE_NAME, identifier, type: 'ignoreDependencies' });
        } else if (!this.isProduction && !isListed && !isReferenced) {
          configurationHints.add({ workspaceName: ROOT_WORKSPACE_NAME, identifier, type: 'ignoreDependencies' });
        }
      }

      for (const identifier of manifest.ignoreBinaries) {
        const isInstalled = hasMatchInSet(allInstalledBinaryNames, identifier);
        const isReferenced = hasMatchInSet(allReferencedBinaries, identifier);
        if (typeof identifier === 'string' && isInstalled && isReferenced) {
          configurationHints.add({ workspaceName: ROOT_WORKSPACE_NAME, identifier, type: 'ignoreBinaries' });
        } else if (!this.isProduction && !isInstalled && !isReferenced) {
          configurationHints.add({ workspaceName: ROOT_WORKSPACE_NAME, identifier, type: 'ignoreBinaries' });
        }
      }
    }

    return configurationHints;
  }
}
