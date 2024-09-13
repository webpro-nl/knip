import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from './modules.js';
import { dirname, isInNodeModules, isInternal } from './path.js';
import { fromBinary, isBinary } from './protocols.js';
import { _resolveSync } from './resolve.js';

export const getReferencedDependencyHandler =
  (collector: IssueCollector, deputy: DependencyDeputy, chief: ConfigurationChief) =>
  (specifier: string, containingFilePath: string, workspace: Workspace) => {
    if (isBinary(specifier)) {
      const binaryName = fromBinary(specifier);
      const isHandled = deputy.maybeAddReferencedBinary(workspace, binaryName);
      if (!isHandled)
        collector.addIssue({
          type: 'binaries',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: binaryName,
        });
    } else {
      if (isInternal(specifier)) {
        const resolvedFilePath = _resolveSync(specifier, dirname(containingFilePath));
        if (resolvedFilePath) return resolvedFilePath;
        collector.addIssue({
          type: 'unresolved',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: specifier,
        });
      } else {
        const packageName = isInNodeModules(specifier)
          ? getPackageNameFromFilePath(specifier) // Pattern: /abs/path/to/repo/node_modules/package/index.js
          : getPackageNameFromModuleSpecifier(specifier); // Patterns: package, @any/package, @local/package, self-ref
        const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        if (!isHandled)
          collector.addIssue({
            type: 'unlisted',
            filePath: containingFilePath,
            workspace: workspace.name,
            symbol: specifier,
          });

        // Patterns: @local/package/file, self-reference/file, ./node_modules/@scope/pkg/tsconfig.json
        if (packageName && specifier !== packageName) {
          const specifierWorkspace = chief.workspacePackagesByPkgName.get(packageName);
          if (specifierWorkspace) {
            if (specifier.startsWith(packageName)) {
              const dir = specifier.replace(new RegExp(`^${packageName}`), `./${specifierWorkspace.name}`);
              const resolvedFilePath = _resolveSync(dir, chief.cwd);
              if (resolvedFilePath) return resolvedFilePath;
            }

            const resolvedFilePath = _resolveSync(specifier, dirname(containingFilePath));
            if (resolvedFilePath) return resolvedFilePath;

            collector.addIssue({
              type: 'unresolved',
              filePath: containingFilePath,
              workspace: workspace.name,
              symbol: specifier,
            });
          }
        }
      }
    }
  };
