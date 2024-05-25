import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import {
  getPackageNameFromFilePath,
  getPackageNameFromModuleSpecifier,
  normalizeSpecifierFromFilePath,
} from './modules.js';
import { isInNodeModules, isInternal } from './path.js';
import { fromBinary, isBinary } from './protocols.js';
import { _resolveSpecifier } from './require.js';
import { resolveSync } from './resolve.js';

export const getHandler =
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
        const resolvedFilePath = resolveSync(specifier, containingFilePath);
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
          const otherWorkspace = chief.workspacePackagesByName.get(packageName);
          if (otherWorkspace) {
            const filePath = _resolveSpecifier(otherWorkspace.dir, normalizeSpecifierFromFilePath(specifier));
            if (filePath) return filePath;
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
