import type { ConfigurationChief, Workspace } from '../ConfigurationChief.ts';
import { DEFAULT_EXTENSIONS } from '../constants.ts';
import { PackagePeeker } from '../PackagePeeker.ts';
import type { ProjectPrincipal } from '../ProjectPrincipal.ts';
import type { Issue } from '../types/issues.ts';
import { isFile } from '../util/fs.ts';
import type { Input } from '../util/input.ts';
import { getPackageNameFromModuleSpecifier, sanitizeSpecifier } from '../util/modules.ts';
import { getEntriesFromExports, getExportEntries, getPackageTargetPaths } from '../util/package-json.ts';
import { extname, join } from '../util/path.ts';
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

  private isSubpathSpecifier(specifier: string) {
    if (specifier.startsWith('#')) return true;
    const packageName = getPackageNameFromModuleSpecifier(specifier);
    return packageName !== undefined && this.chief.isWorkspacePackageName(packageName);
  }

  addInput(input: Input, owner: string) {
    const { specifier, containingFilePath, dir } = input;
    if (!containingFilePath || !this.isSubpathSpecifier(specifier)) return;
    const filePath = dir ? join(dir, 'package.json') : containingFilePath;
    const references = this.inputs.get(owner);
    if (references) references.push([specifier, filePath]);
    else this.inputs.set(owner, [[specifier, filePath]]);
    if (this.isActive) this.add(specifier, filePath);
  }

  add(specifier: string, containingFilePath: string) {
    const workspace = this.chief.findWorkspaceByFilePath(containingFilePath);
    const id = `${workspace?.name ?? ''}\0${specifier}`;
    if (this.seen.has(id)) return;
    this.seen.add(id);
    const target = this.findWorkspacePackageTarget(sanitizeSpecifier(specifier), containingFilePath);
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
    for (const { name, manifestPath, manifestStr, config } of this.workspaces) {
      const manifest = this.chief.getManifestForWorkspace(name);
      if (!manifest) continue;
      const referenced = this.referenced.get(name);
      const peeker = new PackagePeeker(manifestStr);
      const addIssue = (section: 'imports' | 'exports', key: string) => {
        issues.push({
          type: 'subpaths',
          filePath: manifestPath,
          workspace: name,
          symbol: key,
          ...(peeker.getPropertyLocation(section, key) ?? peeker.getPropertyLocation(section)),
          fixes: [],
        });
      };
      if (manifest.imports) {
        for (const key in manifest.imports) {
          if (key.startsWith('#') && manifest.imports[key] !== null && !referenced?.has(key)) addIssue('imports', key);
        }
      }
      if (manifest.exports && config.isIncludeSubpathExports) {
        for (const [key, value] of getExportEntries(manifest.exports)) {
          if (value !== null && !referenced?.has(key) && this.hasModuleTarget(value)) addIssue('exports', key);
        }
      }
    }
    return issues;
  }

  private hasModuleTarget(value: unknown) {
    return getEntriesFromExports(value).some(target => !extname(target) || this.principal.hasAcceptedExtension(target));
  }
}
