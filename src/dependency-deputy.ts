import { isBuiltin } from 'node:module';
import micromatch from 'micromatch';
import { IGNORE_DEFINITELY_TYPED } from './constants.js';
import { WorkspaceConfiguration } from './types/config.js';
import {
  getPackageNameFromModuleSpecifier,
  isDefinitelyTyped,
  getDefinitelyTypedFor,
  getPackageFromDefinitelyTyped,
} from './util/modules.js';
import type { Issue } from './types/issues.js';
import type { WorkspaceManifests } from './types/workspace.js';
import type { PeerDependencies, InstalledBinaries } from './types/workspace.js';
import type { PackageJson } from 'type-fest';

type Options = {
  isStrict: boolean;
  ignoreDependencies: string[];
};

/**
 * - Stores manifests
 * - Stores referenced external dependencies
 * - Stores binaries and peer dependencies
 * - Settles dependency issues
 */
export default class DependencyDeputy {
  isStrict;
  _manifests: WorkspaceManifests = new Map();
  ignoreDependencies;
  referencedDependencies: Map<string, Set<string>>;
  peerDependencies: Map<string, PeerDependencies>;
  installedBinaries: Map<string, InstalledBinaries>;

  tsConfigPathGlobs: Map<string, string[]> = new Map();

  constructor({ isStrict, ignoreDependencies }: Options) {
    this.isStrict = isStrict;
    this.ignoreDependencies = ignoreDependencies;
    this.referencedDependencies = new Map();
    this.peerDependencies = new Map();
    this.installedBinaries = new Map();
  }

  public addWorkspace({
    name,
    dir,
    manifestPath,
    manifest,
  }: {
    name: string;
    dir: string;
    manifestPath: string;
    manifest: PackageJson;
  }) {
    const scripts = Object.values(manifest.scripts ?? {}) as string[];
    const dependencies = Object.keys(manifest.dependencies ?? {});
    const peerDependencies = Object.keys(manifest.peerDependencies ?? {});
    const optionalDependencies = Object.keys(manifest.optionalDependencies ?? {});
    const devDependencies = Object.keys(manifest.devDependencies ?? {});
    const allDependencies = [...dependencies, ...devDependencies, ...peerDependencies, ...optionalDependencies];

    this._manifests.set(name, {
      workspaceDir: dir,
      manifestPath,
      scripts,
      dependencies,
      peerDependencies,
      optionalDependencies,
      devDependencies,
      allDependencies,
    });
  }

  getWorkspaceManifest(workspaceName: string) {
    return this._manifests.get(workspaceName);
  }

  getProductionDependencies(workspaceName: string) {
    return this._manifests.get(workspaceName)?.dependencies ?? [];
  }

  getDevDependencies(workspaceName: string) {
    return this._manifests.get(workspaceName)?.devDependencies ?? [];
  }

  setInstalledBinaries(workspaceName: string, installedBinaries: Map<string, Set<string>>) {
    this.installedBinaries.set(workspaceName, installedBinaries);
  }

  getInstalledBinaries(workspaceName: string) {
    return this.installedBinaries.get(workspaceName);
  }

  addTypeScriptConfigPathGlobs(workspaceName: string, paths: Record<string, string[]>) {
    const wsPaths = this.tsConfigPathGlobs.get(workspaceName) ?? [];
    const addPaths = Object.keys(paths).map(value => value.replace(/\*/g, '**'));
    this.tsConfigPathGlobs.set(workspaceName, [...wsPaths, ...addPaths]);
  }

  addReferencedDependency(workspaceName: string, packageName: string) {
    if (!this.referencedDependencies.has(workspaceName)) {
      this.referencedDependencies.set(workspaceName, new Set());
    }
    this.referencedDependencies.get(workspaceName)?.add(packageName);
  }

  addPeerDependencies(workspaceName: string, peerDependencies: Map<string, Set<string>>) {
    this.peerDependencies.set(workspaceName, peerDependencies);
  }

  getPeerDependencies(workspaceName: string, dependency: string) {
    return Array.from(this.peerDependencies.get(workspaceName)?.get(dependency) ?? []);
  }

  public maybeAddListedReferencedDependency(
    workspace: { name: string; dir: string; config: WorkspaceConfiguration; ancestors: string[] },
    moduleSpecifier: string
  ) {
    if (this.isInternalDependency(workspace.name, moduleSpecifier)) return;

    const packageName = getPackageNameFromModuleSpecifier(moduleSpecifier);
    const workspaceNames = this.isStrict ? [workspace.name] : [workspace.name, ...[...workspace.ancestors].reverse()];
    const closestWorkspaceName = workspaceNames.find(name => this.isInDependencies(name, packageName));

    // Prevent false positives by also marking the `@types/packageName` dependency as referenced
    const typesPackageName = !isDefinitelyTyped(packageName) && getDefinitelyTypedFor(packageName);
    const closestWorkspaceNameForTypes =
      typesPackageName && workspaceNames.find(name => this.isInDependencies(name, typesPackageName));

    if (closestWorkspaceName || closestWorkspaceNameForTypes) {
      closestWorkspaceName && this.addReferencedDependency(closestWorkspaceName, packageName);
      closestWorkspaceNameForTypes && this.addReferencedDependency(closestWorkspaceNameForTypes, typesPackageName);
      return;
    }

    // Handle binaries
    for (const name of workspaceNames) {
      const binaries = this.getInstalledBinaries(name);
      if (binaries?.has(moduleSpecifier)) {
        const dependencies = binaries.get(moduleSpecifier);
        if (dependencies?.size) {
          dependencies.forEach(dependency => this.addReferencedDependency(name, dependency));
          return;
        }
      }
    }

    return moduleSpecifier;
  }

  isInternalDependency(workspaceName: string, moduleSpecifier: string) {
    if (moduleSpecifier.startsWith('/') || moduleSpecifier.startsWith('.')) return true;
    if (isBuiltin(moduleSpecifier)) return true;
    const packageName = getPackageNameFromModuleSpecifier(moduleSpecifier);
    return (
      !this.isInDependencies(workspaceName, packageName) && this.isAliasedDependency(workspaceName, moduleSpecifier)
    );
  }

  private isAliasedDependency(workspaceName: string, moduleSpecifier: string) {
    const patterns = this.tsConfigPathGlobs.get(workspaceName);
    return patterns && patterns.length > 0 && micromatch.isMatch(moduleSpecifier, patterns);
  }

  private isInDependencies(workspaceName: string, packageName: string) {
    const manifest = this._manifests.get(workspaceName);
    const dependencies = manifest ? (this.isStrict ? manifest.dependencies : manifest.allDependencies) : [];
    return dependencies.includes(packageName);
  }

  public settleDependencyIssues() {
    const dependencyIssues: Issue[] = [];
    const devDependencyIssues: Issue[] = [];

    for (const [workspaceName, { manifestPath }] of this._manifests.entries()) {
      const referencedDependencies = this.referencedDependencies.get(workspaceName);

      const isUnreferencedDependency = (dependency: string): boolean => {
        // Is referenced, ignore
        if (referencedDependencies?.has(dependency)) return false;

        const [scope, typedDependency] = dependency.split('/');
        if (scope === '@types') {
          const typedPackageName = getPackageFromDefinitelyTyped(typedDependency);
          // Ignore `@types/*` packages that don't have a related dependency (e.g. `@types/node`)
          if (IGNORE_DEFINITELY_TYPED.includes(typedPackageName)) return false;

          // Ignore typed dependencies that have a peer dependency that's referenced
          // Example: `next` has `react-dom` as peer dependency, so when `@types/react-dom` is listed it can be ignored
          const peerDependencies = this.getPeerDependencies(workspaceName, typedPackageName);
          if (peerDependencies.length) {
            return !peerDependencies.find(peerDependency => !isUnreferencedDependency(peerDependency));
          }

          return !referencedDependencies?.has(typedPackageName);
        }

        if (!referencedDependencies?.has(dependency)) {
          const peerDependencies = this.getPeerDependencies(workspaceName, dependency);
          return !peerDependencies.find(peerDependency => !isUnreferencedDependency(peerDependency));
        }

        return false;
      };

      this.getProductionDependencies(workspaceName)
        .filter(symbol => symbol !== 'knip' && !this.ignoreDependencies.includes(symbol))
        .filter(isUnreferencedDependency)
        .forEach(symbol => dependencyIssues.push({ type: 'dependencies', filePath: manifestPath, symbol }));

      this.getDevDependencies(workspaceName)
        .filter(symbol => symbol !== 'knip' && !this.ignoreDependencies.includes(symbol))
        .filter(isUnreferencedDependency)
        .forEach(symbol => devDependencyIssues.push({ type: 'devDependencies', filePath: manifestPath, symbol }));
    }

    return { dependencyIssues, devDependencyIssues };
  }
}
