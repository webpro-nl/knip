import ts from 'typescript';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import { debugLog } from './util/debug.js';
import { toAbsolute } from './util/path.js';
import type { SyncCompilers, AsyncCompilers } from './compilers/types.js';

type Paths = ts.CompilerOptions['paths'];

type Principal = { principal: ProjectPrincipal; cwds: Set<string>; pathKeys: Set<string>; pkgNames: Set<string> };
type Principals = Set<Principal>;

export type PrincipalOptions = {
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  paths: Paths;
  compilers: [SyncCompilers, AsyncCompilers];
  pkgName: string;
  isGitIgnored: (path: string) => boolean;
  isIsolateWorkspaces: boolean;
};

const mapToAbsolutePaths = (paths: NonNullable<Paths>, cwd: string): Paths =>
  Object.keys(paths).reduce((result, key) => {
    result[key] = paths[key].map(entry => toAbsolute(entry, cwd));
    return result;
  }, {} as NonNullable<Paths>);

const mergePaths = (cwd: string, compilerOptions: ts.CompilerOptions, paths: Paths = {}) => {
  const compilerPaths =
    !compilerOptions.baseUrl && compilerOptions.paths
      ? mapToAbsolutePaths(compilerOptions.paths, cwd)
      : compilerOptions.paths;
  const extraPaths = mapToAbsolutePaths(paths, cwd);
  compilerOptions.paths = { ...compilerPaths, ...extraPaths };
  return compilerOptions;
};

/**
 * The principal factory hands out ProjectPrincipals. It tries to reuse programs, since they're expensive in terms of
 * performance. Time will tell if this is actually feasible or not.
 */
export class PrincipalFactory {
  principals: Principals = new Set();

  public getPrincipal(options: PrincipalOptions) {
    const { cwd, compilerOptions, paths, pkgName, isIsolateWorkspaces, compilers } = options;
    options.compilerOptions = mergePaths(cwd, compilerOptions, paths);
    const principal = this.findReusablePrincipal(compilerOptions);
    if (!isIsolateWorkspaces && principal) {
      this.linkPrincipal(principal, cwd, compilerOptions, pkgName, compilers);
      return principal.principal;
    } else {
      return this.addNewPrincipal(options);
    }
  }

  /**
   * Principals with shared `compilerOptions.baseUrl` and no `compilerOptions.paths` conflicts are reused.
   */
  private findReusablePrincipal(compilerOptions: ts.CompilerOptions) {
    const workspacePaths = compilerOptions?.paths ? Object.keys(compilerOptions.paths) : [];
    const principal = Array.from(this.principals).find(principal => {
      if (compilerOptions.pathsBasePath && principal.principal.compilerOptions.pathsBasePath) return false;
      if (compilerOptions.baseUrl === principal.principal.compilerOptions.baseUrl) {
        return workspacePaths.every(p => !principal.pathKeys.has(p));
      }
      return !compilerOptions.baseUrl;
    });
    return principal;
  }

  private linkPrincipal(
    principal: Principal,
    cwd: string,
    compilerOptions: ts.CompilerOptions,
    pkgName: string,
    compilers: [SyncCompilers, AsyncCompilers]
  ) {
    const { pathsBasePath, paths } = compilerOptions;
    if (pathsBasePath) principal.principal.compilerOptions.pathsBasePath = pathsBasePath;
    Object.keys(paths ?? {}).forEach(p => principal.pathKeys.add(p));
    principal.principal.addPaths(paths);
    principal.principal.addCompilers(compilers);
    principal.cwds.add(cwd);
    principal.pkgNames.add(pkgName);
  }

  private addNewPrincipal(options: PrincipalOptions) {
    const { cwd, compilerOptions, pkgName } = options;
    const pathKeys = new Set(Object.keys(compilerOptions?.paths ?? {}));
    const principal = new ProjectPrincipal(options);
    this.principals.add({ principal, cwds: new Set([cwd]), pathKeys, pkgNames: new Set([pkgName]) });
    return principal;
  }

  public getPrincipals() {
    return Array.from(this.principals, p => p.principal).reverse();
  }

  public getPrincipalByPackageName(packageName: string) {
    return Array.from(this.principals).find(principal => principal.pkgNames.has(packageName))?.principal;
  }

  public deletePrincipal(principal: ProjectPrincipal) {
    const p = Array.from(this.principals).find(p => p.principal === principal);
    if (p) {
      debugLog('*', `Deleting principal at ${[...p.cwds]} for ${[...p.pkgNames]}`);
      this.principals.delete(p);
    }
  }
}
