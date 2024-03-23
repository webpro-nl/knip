import micromatch from 'micromatch';
import { ProjectPrincipal } from '../ProjectPrincipal.js';
import {
  getPackageNameFromFilePath,
  getPackageNameFromModuleSpecifier,
  normalizeSpecifierFromFilePath,
} from './modules.js';
import { isInNodeModules, join, isInternal } from './path.js';
import { fromBinary, isBinary } from './protocols.js';
import { _resolveSpecifier } from './require.js';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';

export const getHandler =
  (collector: IssueCollector, deputy: DependencyDeputy, chief: ConfigurationChief) =>
  (specifier: string, containingFilePath: string, workspace: Workspace, principal: ProjectPrincipal) => {
    if (isInternal(specifier)) {
      // Pattern: ./module.js, /abs/path/to/module.js, /abs/path/to/module/index.js, ./module.ts, ./module.d.ts
      const filePath = principal.resolveModule(specifier, containingFilePath)?.resolvedFileName;
      if (filePath) {
        const ignorePatterns = workspace.config?.ignore.map(pattern => join(workspace.dir, pattern)) ?? [];
        const isIgnored = micromatch.isMatch(filePath, ignorePatterns);
        if (!isIgnored) principal.addEntryPath(filePath);
      } else {
        collector.addIssue({ type: 'unresolved', filePath: containingFilePath, symbol: specifier });
      }
    } else {
      if (isBinary(specifier)) {
        const binaryName = fromBinary(specifier);
        const isHandled = deputy.maybeAddReferencedBinary(workspace, binaryName);
        if (!isHandled) collector.addIssue({ type: 'binaries', filePath: containingFilePath, symbol: binaryName });
      } else {
        const packageName = isInNodeModules(specifier)
          ? getPackageNameFromFilePath(specifier) // Pattern: /abs/path/to/repo/node_modules/package/index.js
          : getPackageNameFromModuleSpecifier(specifier); // Patterns: package, @any/package, @local/package, self-ref

        const isHandled = packageName && deputy.maybeAddReferencedExternalDependency(workspace, packageName);
        if (!isHandled) collector.addIssue({ type: 'unlisted', filePath: containingFilePath, symbol: specifier });

        // Patterns: @local/package/file, self-reference/file, ./node_modules/@scope/pkg/tsconfig.json
        if (packageName && specifier !== packageName) {
          const otherWorkspace = chief.availableWorkspaceManifests.find(w => w.manifest.name === packageName);
          if (otherWorkspace) {
            const filePath = _resolveSpecifier(otherWorkspace.dir, normalizeSpecifierFromFilePath(specifier));
            if (filePath) {
              principal.addEntryPath(filePath, { skipExportsAnalysis: true });
            } else {
              collector.addIssue({ type: 'unresolved', filePath: containingFilePath, symbol: specifier });
            }
          }
        }
      }
    }
  };
