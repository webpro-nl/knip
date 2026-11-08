import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { PackagePeeker } from '../PackagePeeker.ts';
import type { ProjectPrincipal } from '../ProjectPrincipal.ts';
import type { Issue } from '../types/issues.ts';
import { isFile } from '../util/fs.ts';
import type { Input } from '../util/input.ts';
import { sanitizeSpecifier } from '../util/modules.ts';
import { getPackageTargetPaths } from '../util/package-json.ts';
import { join } from '../util/path.ts';
import type { WorkspacePackageTargetHandler } from '../util/to-source-path.ts';

type InputReference = [specifier: string, containingFilePath: string];

interface SubpathReferencesOptions {
  chief: ConfigurationChief;
  principal: ProjectPrincipal;
  workspaces: Workspace[];
  findWorkspacePackageTarget: WorkspacePackageTargetHandler;
  isGitIgnored: (filePath: string) => boolean;
}

export class SubpathReferences {
  private chief: ConfigurationChief;
  private principal: ProjectPrincipal;
  private workspaces: Workspace[];
  private findWorkspacePackageTarget: WorkspacePackageTargetHandler;
  private isGitIgnored: (filePath: string) => boolean;
  private extensions: string[] = [];
  private isActive = false;
  private inputs = new Map<string, InputReference[]>();
  private seen = new Set<string>();
  private referenced = new Map<string, Set<string>>();

  constructor({ chief, principal, workspaces, findWorkspacePackageTarget, isGitIgnored }: SubpathReferencesOptions) {
    this.chief = chief;
    this.principal = principal;
    this.workspaces = workspaces;
    this.findWorkspacePackageTarget = findWorkspacePackageTarget;
    this.isGitIgnored = isGitIgnored;
  }

  addInput(input: Input, owner: string) {
    const { specifier, containingFilePath, dir } = input;
    if (!containingFilePath || !specifier.startsWith('#')) return;
    const filePath = dir ? join(dir, 'package.json') : containingFilePath;
    const references = this.inputs.get(owner);
    if (references) references.push([specifier, filePath]);
    else this.inputs.set(owner, [[specifier, filePath]]);
    if (this.isActive) this.add(specifier, filePath);
  }

  add(specifier: string, containingFilePath: string) {
    const sanitizedSpecifier = sanitizeSpecifier(specifier);
    if (!sanitizedSpecifier.startsWith('#')) return;
    const workspace = this.chief.findWorkspaceByFilePath(containingFilePath);
    const id = `${workspace?.name ?? ''}\0${sanitizedSpecifier}`;
    if (this.seen.has(id)) return;
    this.seen.add(id);
    const target = this.findWorkspacePackageTarget(sanitizedSpecifier, containingFilePath);
    if (!target) return;
    const subpaths = this.referenced.get(target.name);
    if (subpaths) subpaths.add(target.subpath);
    else this.referenced.set(target.name, new Set([target.subpath]));
    for (const targetPath of getPackageTargetPaths(target.target, target.dir, target.patternMatch, true)) {
      const filePath =
        this.principal.toSourceFilePath(targetPath, this.extensions) ?? (isFile(targetPath) ? targetPath : undefined);
      if (filePath && !this.isGitIgnored(filePath)) this.principal.claimEntryPath(filePath);
    }
  }

  release(owner: string) {
    this.inputs.delete(owner);
  }

  reset() {
    this.isActive = true;
    this.extensions = [...DEFAULT_EXTENSIONS, ...this.principal.compilers.keys()];
    this.seen.clear();
    this.referenced.clear();
    this.principal.releaseEntryClaims();
    for (const references of this.inputs.values()) {
      for (const [specifier, containingFilePath] of references) this.add(specifier, containingFilePath);
    }
  }

  getIssues() {
    const issues: Issue[] = [];
    for (const { name, manifestPath, manifestStr } of this.workspaces) {
      const imports = this.chief.getManifestForWorkspace(name)?.imports;
      if (!imports) continue;
      const referenced = this.referenced.get(name);
      const peeker = new PackagePeeker(manifestStr);
      for (const key in imports) {
        if (!key.startsWith('#') || imports[key] === null || referenced?.has(key)) continue;
        issues.push({
          type: 'subpaths',
          filePath: manifestPath,
          workspace: name,
          symbol: key,
          ...peeker.getPropertyLocation('imports', key),
          fixes: [],
        });
      }
    }
    return issues;
  }
}
