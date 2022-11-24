// @ts-ignore Member actually exists: https://nodejs.org/api/module.html#moduleisbuiltinmodulename
import { isBuiltin } from 'node:module';
import micromatch from 'micromatch';
import { WorkspaceConfiguration } from './types/config.js';
import type { Issue } from './types/issues.js';
import type { WorkspaceManifests } from './types/workspace.js';
import type { PackageJson } from 'type-fest';

const IGNORE_DEFINITELY_TYPED = ['node'];

/**
 * - Stores manifests
 * - Stores referenced external dependencies
 * - Settles dependency issues
 */
export default class DependencyDeputy {
  _manifests: WorkspaceManifests = new Map();
  manifests: Map<string, PackageJson> = new Map();
  canceledWorkspaces: Set<string>;
  referencedDependencies: Map<string, Set<string>>;
  peerDependencies: Map<string, Map<string, Set<string>>>;

  tsConfigPathGlobs: Map<string, string[]> = new Map();

  isProduction = false;

  constructor() {
    this.referencedDependencies = new Map();
    this.peerDependencies = new Map();
    this.canceledWorkspaces = new Set();
  }

  public addWorkspace({
    name,
    dir,
    manifestPath,
    manifest,
    isProduction,
  }: {
    name: string;
    dir: string;
    manifestPath: string;
    manifest: PackageJson;
    isProduction: boolean;
  }) {
    const scripts = Object.values(manifest.scripts ?? {}) as string[];
    const dependencies = Object.keys(manifest.dependencies ?? {});
    const peerDependencies = Object.keys(manifest.peerDependencies ?? {});
    const optionalDependencies = Object.keys(manifest.optionalDependencies ?? {});
    const devDependencies = Object.keys(manifest.devDependencies ?? {});
    const productionDependencies = [...dependencies, ...peerDependencies, ...optionalDependencies];

    this.manifests.set(name, manifest);

    this._manifests.set(name, {
      workspaceDir: dir,
      manifestPath,
      scripts,
      dependencies,
      peerDependencies,
      optionalDependencies,
      devDependencies,
      productionDependencies,
      allDependencies: [...productionDependencies, ...devDependencies],
    });

    this.isProduction = isProduction;
  }

  public cancelWorkspace(workspaceName: string) {
    this.canceledWorkspaces.add(workspaceName);
  }

  getManifest(workspaceName: string) {
    return this.manifests.get(workspaceName);
  }

  getWorkspaceManifest(workspaceName: string) {
    return this._manifests.get(workspaceName);
  }

  getProductionDependencies(workspaceName: string) {
    return this._manifests.get(workspaceName)?.productionDependencies ?? [];
  }

  getDevDependencies(workspaceName: string) {
    return this._manifests.get(workspaceName)?.devDependencies ?? [];
  }

  getAllDependencies(workspaceName: string) {
    return this._manifests.get(workspaceName)?.allDependencies ?? [];
  }

  addTypeScriptConfigPathGlobs(workspaceName: string, paths: Record<string, string[]>) {
    this.tsConfigPathGlobs.set(workspaceName, paths ? Object.keys(paths).map(p => p.replace(/\*/g, '**')) : []);
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

  public maybeAddListedReferencedDependency(
    workspace: { name: string; dir: string; config: WorkspaceConfiguration; ancestors: string[] },
    moduleSpecifier: string,
    isStrict: boolean
  ) {
    if (this.isInternalDependency(workspace.name, moduleSpecifier)) return;

    const packageName = this.resolvePackageName(moduleSpecifier);
    const workspaceNames = isStrict ? [workspace.name] : [workspace.name, ...[...workspace.ancestors].reverse()];
    const closestWorkspaceName = workspaceNames.find(name => this.isInDependencies(name, packageName));

    if (closestWorkspaceName) {
      this.addReferencedDependency(closestWorkspaceName, packageName);
    } else {
      return moduleSpecifier;
    }
  }

  isInternalDependency(workspaceName: string, moduleSpecifier: string) {
    if (moduleSpecifier.startsWith('/') || moduleSpecifier.startsWith('.')) return true;
    if (isBuiltin(moduleSpecifier)) return true;
    const packageName = this.resolvePackageName(moduleSpecifier);
    return (
      !this.isInDependencies(workspaceName, packageName) && this.isAliasedDependency(workspaceName, moduleSpecifier)
    );
  }

  private isAliasedDependency(workspaceName: string, moduleSpecifier: string) {
    const patterns = this.tsConfigPathGlobs.get(workspaceName);
    return patterns && patterns.length > 0 && micromatch.isMatch(moduleSpecifier, patterns);
  }

  resolvePackageName(moduleSpecifier: string) {
    const parts = moduleSpecifier.split('/').slice(0, 2);
    return moduleSpecifier.startsWith('@') ? parts.join('/') : parts[0];
  }

  private isInDependencies(workspaceName: string, packageName: string) {
    const manifest = this._manifests.get(workspaceName);
    return Boolean(manifest?.allDependencies.includes(packageName));
  }

  public settleDependencyIssues() {
    const dependencyIssues: Issue[] = [];
    const devDependencyIssues: Issue[] = [];

    for (const [workspaceName, { manifestPath }] of this._manifests.entries()) {
      if (this.canceledWorkspaces.has(workspaceName)) continue;

      const referencedDependencies = this.referencedDependencies.get(workspaceName);

      const isUnreferencedDependency = (dependency: string): boolean => {
        const [scope, typedDependency] = dependency.split('/');
        if (scope === '@types') {
          if (IGNORE_DEFINITELY_TYPED.includes(typedDependency)) return false;
          if (referencedDependencies?.has(dependency)) return false;
          const [scope, name] = typedDependency.split('__');
          const typedPackageName = scope && name ? `@${scope}/${name}` : typedDependency;
          return referencedDependencies ? !referencedDependencies.has(typedPackageName) : false;
        }

        if (!referencedDependencies?.has(dependency)) {
          const peerDependencies = Array.from(this.peerDependencies.get(workspaceName)?.get(dependency) ?? []);
          return !peerDependencies.find(peerDependency => !isUnreferencedDependency(peerDependency));
        }

        return false;
      };

      this.getProductionDependencies(workspaceName)
        .filter(isUnreferencedDependency)
        .forEach(symbol => dependencyIssues.push({ type: 'dependencies', filePath: manifestPath, symbol }));

      this.getDevDependencies(workspaceName)
        .filter(isUnreferencedDependency)
        .forEach(symbol => devDependencyIssues.push({ type: 'devDependencies', filePath: manifestPath, symbol }));
    }

    return { dependencyIssues, devDependencyIssues };
  }
}
