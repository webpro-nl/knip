import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { IssueCollector } from '../IssueCollector.js';
import { IGNORED_RUNTIME_DEPENDENCIES } from '../constants.js';
import { debugLog } from './debug.js';
import { isDeferResolve, toDebugString } from './input.js';
import { type Input, fromBinary, isBinary, isConfig, isDeferResolveEntry, isDependency } from './input.js';
import { getPackageNameFromSpecifier } from './modules.js';
import { dirname, isAbsolute, isInternal, join } from './path.js';
import { _resolveSync } from './resolve.js';

const getWorkspaceFor = (input: Input, chief: ConfigurationChief, workspace: Workspace) =>
  (input.dir && chief.findWorkspaceByFilePath(`${input.dir}/`)) ||
  (input.containingFilePath && chief.findWorkspaceByFilePath(input.containingFilePath)) ||
  workspace;

/**
 * Resolve internal file paths + collect issues
 *
 * Try not to use module resolver. This is slow. Use known workspaces and dependencies.
 * Eventually we might be able to work mostly from lockfile alone.
 */
export const getReferencedInputsHandler =
  (
    collector: IssueCollector,
    deputy: DependencyDeputy,
    chief: ConfigurationChief,
    isGitIgnored: (s: string) => boolean
  ) =>
  (input: Input, workspace: Workspace) => {
    const { specifier, containingFilePath } = input;

    if (!containingFilePath || IGNORED_RUNTIME_DEPENDENCIES.has(specifier)) return;

    if (isBinary(input)) {
      const binaryName = fromBinary(input);
      const inputWorkspace = getWorkspaceFor(input, chief, workspace);
      const isHandled = deputy.maybeAddReferencedBinary(inputWorkspace, binaryName);
      if (isHandled || input.optional) return;
      collector.addIssue({
        type: 'binaries',
        filePath: containingFilePath,
        workspace: workspace.name,
        symbol: binaryName,
        specifier,
      });
      return;
    }

    const packageName = getPackageNameFromSpecifier(specifier);

    if (packageName) {
      // Attempt fast path first for external dependencies and internal workspaces
      const isWorkspace = chief.workspacesByPkgName.has(packageName);
      const inputWorkspace = getWorkspaceFor(input, chief, workspace);

      if (inputWorkspace) {
        const isHandled = deputy.maybeAddReferencedExternalDependency(inputWorkspace, packageName);

        if (isWorkspace || isDependency(input)) {
          if (!isHandled) {
            if (!input.optional && ((deputy.isProduction && input.production) || !deputy.isProduction)) {
              // Unlisted dependency
              collector.addIssue({
                type: 'unlisted',
                filePath: containingFilePath,
                workspace: inputWorkspace.name,
                symbol: packageName ?? specifier,
                specifier,
              });
            }
            return;
          }

          // Return resolved path for refs to internal workspaces
          const ref = _resolveSync(specifier, dirname(containingFilePath));
          if (ref && isInternal(ref) && !isGitIgnored(ref)) return ref;
        }

        if (isHandled) return;
      }
    }

    if (isDeferResolve(input) && deputy.isProduction && !input.production) {
      return;
    }

    const baseDir = input.dir ?? dirname(containingFilePath);
    const filePath = isAbsolute(specifier) ? specifier : join(baseDir, specifier);
    const resolvedFilePath = _resolveSync(filePath, baseDir);

    if (resolvedFilePath && isInternal(resolvedFilePath)) {
      return isGitIgnored(resolvedFilePath) ? undefined : resolvedFilePath;
    }

    if (input.optional) return;

    if (!isInternal(filePath)) {
      collector.addIssue({
        type: 'unlisted',
        filePath: containingFilePath,
        workspace: workspace.name,
        symbol: packageName ?? specifier,
        specifier,
      });
    } else if (!isGitIgnored(filePath)) {
      // Let's start out conservatively
      if (!isDeferResolveEntry(input) && !isConfig(input)) {
        collector.addIssue({
          type: 'unresolved',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: specifier,
        });
      } else {
        debugLog(workspace.name, `Unable to resolve ${toDebugString(input)}`);
      }
    }
  };
