import path from 'node:path';
import ts from 'typescript';
import { ProjectPrincipal } from './project-principal.js';
import { isAbsolute } from './util/path.js';
import type { SyncCompilers, AsyncCompilers } from './types/compilers.js';
import type { Report } from './types/issues.js';

type Paths = ts.CompilerOptions['paths'];

type Principal = { principal: ProjectPrincipal; cwds: Set<string>; paths: Set<string>; isDefaultBaseUrl: boolean };
type Principals = Set<Principal>;

type Options = {
  cwd: string;
  compilerOptions: ts.CompilerOptions;
  report: Report;
  paths: Paths;
  compilers: [SyncCompilers, AsyncCompilers];
};

const mergePaths = (cwd: string, compilerOptions: ts.CompilerOptions = {}, paths: Paths = {}) => {
  const mergedPaths = { ...compilerOptions.paths, ...paths };
  const baseUrl = compilerOptions.baseUrl ?? '.';
  compilerOptions.paths = Object.keys(mergedPaths).reduce((paths, key) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    paths![key] = mergedPaths[key].map(entry => (isAbsolute(entry) ? entry : path.join(cwd, baseUrl, entry)));
    return paths;
  }, {} as Paths);
  return compilerOptions;
};

const hasDefaultBaseUrl = (compilerOptions: ts.CompilerOptions) =>
  !compilerOptions.baseUrl || /^\.\/?$/.test(compilerOptions.baseUrl);

/**
 * The principal factory hands out ProjectPrincipals. It tries to reuse them, since they're expensive in terms of
 * performance. Time will tell if this is actually feasible or not.
 */
export class PrincipalFactory {
  principals: Principals = new Set();

  public getPrincipal({ cwd, compilerOptions, report, paths, compilers }: Options) {
    compilerOptions = mergePaths(cwd, compilerOptions, paths);
    const principal = this.findReusablePrincipal(compilerOptions);
    if (principal) {
      this.linkPrincipal(principal, cwd, compilerOptions.paths);
      return principal.principal;
    } else {
      return this.addNewPrincipal({ cwd, compilerOptions, report, paths, compilers });
    }
  }

  /**
   * Principals (or rather their `compilerOptions`) are considered reusable when:
   *
   * - It does not have any keys in compiler.paths in common
   * - It does not have a (non-default) `baseUrl`
   */
  private findReusablePrincipal(compilerOptions: ts.CompilerOptions) {
    if (!hasDefaultBaseUrl(compilerOptions)) return;
    const workspacePaths = compilerOptions?.paths ? Object.keys(compilerOptions.paths) : [];
    const principal = Array.from(this.principals).find(
      principal => principal.isDefaultBaseUrl && workspacePaths.every(p => !principal.paths.has(p))
    );
    return principal;
  }

  private linkPrincipal(principal: Principal, cwd: string, paths: Paths) {
    Object.keys(paths ?? {}).forEach(p => principal.paths.add(p));
    principal.principal.compilerOptions.paths = { ...principal.principal.compilerOptions.paths, ...paths };
    principal.cwds.add(cwd);
  }

  private addNewPrincipal({ cwd, compilerOptions, report, compilers }: Options) {
    const principal = new ProjectPrincipal({ cwd, compilerOptions, report, compilers });
    const paths = new Set(Object.keys(compilerOptions?.paths ?? {}));
    const isDefaultBaseUrl = hasDefaultBaseUrl(compilerOptions);
    compilerOptions.baseUrl = path.join(cwd, compilerOptions.baseUrl ?? '.');
    this.principals.add({ principal, cwds: new Set([cwd]), paths, isDefaultBaseUrl });
    return principal;
  }

  public getPrincipals() {
    return Array.from(this.principals).map(p => p.principal);
  }
}
