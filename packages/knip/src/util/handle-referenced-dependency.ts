import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import { isFile } from './fs.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from './modules.js';
import { dirname, isAbsolute, isInNodeModules, isInternal, join } from './path.js';
import {
  type Dependency,
  fromBinary,
  isBinary,
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
    if (!containingFilePath) throw new Error(`Missing cont for ${specifier}`);

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

    if (isDependency(dependency) && !deputy.isProduction) {
      const id = getPackageNameFromModuleSpecifier(specifier);
      const isHandled = id && deputy.maybeAddReferencedExternalDependency(workspace, id);
      if (!isHandled)
        collector.addIssue({
          type: 'unlisted',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: specifier,
        });
      return;
    }

    if (isProductionDependency(dependency) && deputy.isProduction) {
      const id = getPackageNameFromModuleSpecifier(specifier);
      const isHandled = id && deputy.maybeAddReferencedExternalDependency(workspace, id);
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

    const baseDir = dependency.dir ?? dirname(containingFilePath);
    const filePath = join(baseDir, specifier);
    const relPath = isDeferResolveEntry(dependency) && !specifier.startsWith('.') ? `./${specifier}` : specifier;
    const resolvedFilePath = isAbsolute(filePath) && isFile(filePath) ? filePath : _resolveSync(relPath, baseDir);

    const packageName = isInNodeModules(specifier)
      ? getPackageNameFromFilePath(specifier) // Pattern: /abs/path/to/repo/node_modules/package/index.js
      : getPackageNameFromModuleSpecifier(specifier); // Patterns: package, @any/package, @local/package, self-ref

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

    // throw new Error(`Unhandled dependency: ${dependency.specifier} ${JSON.stringify(dependency)}`);
  };
