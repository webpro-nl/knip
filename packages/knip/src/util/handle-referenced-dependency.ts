import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import { IGNORED_RUNTIME_DEPENDENCIES, ROOT_WORKSPACE_NAME } from '../constants.js';
import { isFile } from './fs.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from './modules.js';
import { dirname, isAbsolute, isInNodeModules, isInternal, join } from './path.js';
import {
  type Dependency,
  fromBinary,
  isBinary,
  isConfigPattern,
  isDeferResolve,
  isDeferResolveEntry,
  isDependency,
  isEntry,
  isProductionDependency,
  isProductionEntry,
} from './protocols.js';
import { _resolveSync } from './resolve.js';

// Handler for left-overs and unresolved specifiers.Internal entry paths should be returned to flow back into the program.
export const getReferencedDependencyHandler =
  (
    collector: IssueCollector,
    deputy: DependencyDeputy,
    chief: ConfigurationChief,
    isGitIgnored: (s: string) => boolean
  ) =>
  (dependency: Dependency, workspace: Workspace) => {
    const { specifier, containingFilePath } = dependency;
    if (!containingFilePath || IGNORED_RUNTIME_DEPENDENCIES.has(specifier)) return;

    if (isConfigPattern(dependency)) {
      if (!isInternal(specifier)) {
        const packageName = isInNodeModules(specifier)
          ? getPackageNameFromFilePath(specifier)
          : getPackageNameFromModuleSpecifier(specifier);
        packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        return;
      }
      return dependency.specifier;
    }

    if (isBinary(dependency)) {
      const binaryName = fromBinary(dependency);
      const ws = (dependency.dir && chief.findWorkspaceByFilePath(`${dependency.dir}/`)) || workspace;
      const isHandled = deputy.maybeAddReferencedBinary(ws, binaryName);
      if (!isHandled) {
        collector.addIssue({
          type: 'binaries',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: binaryName,
        });
      }
      return;
    }

    const packageName = isInNodeModules(specifier)
      ? getPackageNameFromFilePath(specifier) // Pattern: /abs/path/to/repo/node_modules/package/index.js
      : getPackageNameFromModuleSpecifier(specifier); // Patterns: package, @any/package, @local/package, self-ref

    const isWs = packageName && chief.availableWorkspacePkgNames.has(packageName);
    const isInDeps = packageName && deputy._manifests.get(workspace.name)?.allDependencies.has(packageName);
    const isInRootDeps =
      packageName &&
      workspace.name !== ROOT_WORKSPACE_NAME &&
      deputy._manifests.get(ROOT_WORKSPACE_NAME)?.allDependencies.has(packageName);

    // Needs work but cheap early bail-out
    if (
      (deputy.isProduction && isProductionDependency(dependency)) ||
      (!deputy.isProduction &&
        (isDependency(dependency) || (!deputy.isProduction && (isInDeps || isInRootDeps) && !isWs)))
    ) {
      const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
      if (!isHandled) {
        collector.addIssue({
          type: 'unlisted',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: specifier,
        });
      }
      return;
    }

    if (deputy.isProduction && !dependency.production) return;

    const baseDir = dependency.dir ?? dirname(containingFilePath);
    const filePath = join(baseDir, specifier);
    const relPath = isDeferResolveEntry(dependency) && !specifier.startsWith('.') ? `./${specifier}` : specifier;
    const resolvedFilePath = isAbsolute(filePath) && isFile(filePath) ? filePath : _resolveSync(relPath, baseDir);

    if (resolvedFilePath) {
      if (isInternal(resolvedFilePath)) {
        if (packageName) {
          const ws = chief.findWorkspaceByFilePath(resolvedFilePath);
          if (ws && ws.name !== workspace.name) deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        }
        if (!isGitIgnored(resolvedFilePath)) return resolvedFilePath;
      }
    } else {
      //   collector.addIssue({
      //     type: 'unresolved',
      //     filePath: containingFilePath,
      //     workspace: workspace.name,
      //     symbol: specifier,
      //   });
    }

    if (isDeferResolve(dependency)) {
      if (packageName) {
        if (packageName !== workspace.pkgName) {
          const specifierWorkspace = chief.workspacePackagesByPkgName.get(packageName);
          if (specifierWorkspace) {
            if (specifier.startsWith(packageName)) {
              const dir = specifier.replace(new RegExp(`^${packageName}`), `./${specifierWorkspace.name}`);
              const resolvedFilePath = _resolveSync(dir, chief.cwd);
              if (resolvedFilePath && !isGitIgnored(resolvedFilePath)) return resolvedFilePath;
            }
          }
        }

        const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);

        if (packageName && !isHandled) {
          collector.addIssue({
            type: 'unlisted',
            filePath: containingFilePath,
            workspace: workspace.name,
            symbol: isInNodeModules(specifier) ? packageName : specifier,
          });
          return;
        }
      }

      if (resolvedFilePath) {
        const isInModules = isInNodeModules(specifier);
        const packageName = isInModules
          ? getPackageNameFromFilePath(resolvedFilePath) // Pattern: /abs/path/to/repo/node_modules/package/index.js
          : getPackageNameFromModuleSpecifier(specifier); // Patterns: package, @any/package, @local/package, self-ref

        const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);

        if (packageName && !isHandled) {
          collector.addIssue({
            type: 'unlisted',
            filePath: containingFilePath,
            workspace: workspace.name,
            symbol: isInModules ? packageName : specifier,
          });
        }

        return resolvedFilePath;
      }

      const filePath = join(baseDir, specifier);

      if (!resolvedFilePath && isInternal(filePath) && !isGitIgnored(filePath)) {
        collector.addIssue({
          type: 'unresolved',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: specifier,
        });
        return;
      }

      return;
    }

    if (isEntry(dependency) || isProductionEntry(dependency)) {
      return _resolveSync(specifier, dependency.dir ?? dirname(containingFilePath));
    }
  };
