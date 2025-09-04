import ts from 'typescript';
import { ProjectPrincipal } from './ProjectPrincipal.js';
import type { AsyncCompilers, SyncCompilers } from './compilers/types.js';
import type { PrincipalOptions } from './types/project.js';
import type { MainOptions } from './util/create-options.js';
import { debugLog } from './util/debug.js';
import { toRelative } from './util/path.js';

type Principal = { principal: ProjectPrincipal; wsDirs: Set<string>; pathKeys: Set<string>; pkgNames: Set<string> };
type Principals = Set<Principal>;

/**
 * The principal factory hands out ProjectPrincipals. It tries to reuse programs, since they're expensive in terms of
 * memory usage. Time will tell if this is actually feasible or not.
 */
export class PrincipalFactory {
  private principals: Principals = new Set();

  public getPrincipalCount() {
    return this.principals.size;
  }

  public createPrincipal(options: MainOptions, opts: PrincipalOptions) {
    const { dir, compilerOptions, isFile, pkgName, compilers } = opts;
    if (isFile && compilerOptions.module !== ts.ModuleKind.CommonJS)
      compilerOptions.moduleResolution ??= ts.ModuleResolutionKind.Bundler;
    if (!options.isIsolateWorkspaces) {
      const principal = this.findReusablePrincipal(compilerOptions);
      if (principal) {
        this.linkPrincipal(principal, dir, compilerOptions, pkgName, compilers);
        return principal.principal;
      }
    }
    return this.addNewPrincipal(options, opts);
  }

  /**
   * Principals with shared `compilerOptions.baseUrl` and no `compilerOptions.paths` conflicts are reused.
   */
  private findReusablePrincipal(compilerOptions: ts.CompilerOptions) {
    const workspacePaths = compilerOptions?.paths ? Object.keys(compilerOptions.paths) : [];
    return Array.from(this.principals).find(principal => {
      if (compilerOptions.pathsBasePath && principal.principal.compilerOptions.pathsBasePath) return false;
      if (compilerOptions.baseUrl === principal.principal.compilerOptions.baseUrl) {
        return workspacePaths.every(p => !principal.pathKeys.has(p));
      }
      return !compilerOptions.baseUrl;
    });
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
    principal.principal.compilerOptions.moduleResolution ??= compilerOptions.moduleResolution;
    for (const p of Object.keys(paths ?? {})) principal.pathKeys.add(p);
    principal.principal.addPaths(paths, cwd);
    principal.principal.addCompilers(compilers);
    principal.wsDirs.add(cwd);
    principal.pkgNames.add(pkgName);
  }

  private addNewPrincipal(options: MainOptions, opts: PrincipalOptions) {
    const { dir, compilerOptions, pkgName } = opts;
    const pathKeys = new Set(Object.keys(compilerOptions?.paths ?? {}));
    const principal = new ProjectPrincipal(options, opts);
    this.principals.add({ principal, wsDirs: new Set([dir]), pathKeys, pkgNames: new Set([pkgName]) });
    return principal;
  }

  public getPrincipals() {
    return Array.from(this.principals, p => p.principal);
  }

  public getPrincipalByPackageName(packageName: string) {
    return Array.from(this.principals).find(principal => principal.pkgNames.has(packageName))?.principal;
  }

  public deletePrincipal(principal: ProjectPrincipal, cwd: string) {
    const p = Array.from(this.principals).find(p => p.principal === principal);
    if (p) {
      debugLog(
        '*',
        `Deleting principal at ${[...p.wsDirs].map(dir => toRelative(dir, cwd) || '.')} (${[...p.pkgNames]})`
      );
      this.principals.delete(p);
    }
  }
}
