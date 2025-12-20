import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
import { IGNORED_RUNTIME_DEPENDENCIES } from '../constants.js';
import type { DependencyDeputy } from '../DependencyDeputy.js';
import type { Issue } from '../types/issues.js';
import type { ExternalRef } from '../types/module-graph.js';
import type { MainOptions } from './create-options.js';
import { debugLog } from './debug.js';
import {
  fromBinary,
  type Input,
  isBinary,
  isConfig,
  isDeferResolve,
  isDeferResolveEntry,
  isDependency,
  toDebugString,
} from './input.js';
import { getPackageNameFromSpecifier } from './modules.js';
import { dirname, isAbsolute, isInternal, join } from './path.js';
import { _resolveSync } from './resolve.js';

export type ExternalRefsFromInputs = Map<string, Set<ExternalRef>>;

const getWorkspaceFor = (input: Input, chief: ConfigurationChief, workspace: Workspace) =>
  (input.dir && chief.findWorkspaceByFilePath(`${input.dir}/`)) ||
  (input.containingFilePath && chief.findWorkspaceByFilePath(input.containingFilePath)) ||
  workspace;

const addExternalRef = (map: ExternalRefsFromInputs, containingFilePath: string, ref: ExternalRef) => {
  if (!map.has(containingFilePath)) map.set(containingFilePath, new Set());
  map.get(containingFilePath)!.add(ref);
};

export const createInputHandler =
  (
    deputy: DependencyDeputy,
    chief: ConfigurationChief,
    isGitIgnored: (filePath: string) => boolean,
    addIssue: (issue: Issue) => void,
    externalRefs: ExternalRefsFromInputs,
    options: MainOptions
  ) =>
  (input: Input, workspace: Workspace) => {
    const { specifier, containingFilePath } = input;

    if (!containingFilePath || IGNORED_RUNTIME_DEPENDENCIES.has(specifier)) return;

    if (isBinary(input)) {
      const binaryName = fromBinary(input);
      const inputWorkspace = getWorkspaceFor(input, chief, workspace);

      const dependencies = deputy.maybeAddReferencedBinary(inputWorkspace, binaryName);
      if (dependencies) {
        for (const dependency of dependencies) {
          addExternalRef(externalRefs, containingFilePath, { specifier: dependency, identifier: binaryName });
        }
        return;
      }

      if (dependencies || input.optional) return;

      addIssue({
        type: 'binaries',
        filePath: containingFilePath,
        workspace: workspace.name,
        symbol: binaryName,
        specifier,
        fixes: [],
      });

      return;
    }

    const packageName = getPackageNameFromSpecifier(specifier);

    if (packageName && (isDependency(input) || isDeferResolve(input) || isConfig(input))) {
      // Attempt fast path first for external dependencies (including internal workspaces)
      const isWorkspace = chief.workspacesByPkgName.has(packageName);
      const inputWorkspace = getWorkspaceFor(input, chief, workspace);

      if (inputWorkspace) {
        const isHandled = deputy.maybeAddReferencedExternalDependency(inputWorkspace, packageName);

        if (!isWorkspace) {
          addExternalRef(externalRefs, containingFilePath, { specifier: packageName, identifier: undefined });
        }

        if (isWorkspace || isDependency(input)) {
          if (!isHandled) {
            if (!input.optional && ((options.isProduction && input.production) || !options.isProduction)) {
              addIssue({
                type: 'unlisted',
                filePath: containingFilePath,
                workspace: inputWorkspace.name,
                symbol: packageName ?? specifier,
                specifier,
                fixes: [],
              });
            }
            return;
          }

          // Return resolved path for refs to internal workspaces
          const internalPath = _resolveSync(specifier, dirname(containingFilePath));
          if (internalPath && isInternal(internalPath) && !isGitIgnored(internalPath)) return internalPath;
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
      addIssue({
        type: 'unlisted',
        filePath: containingFilePath,
        workspace: workspace.name,
        symbol: packageName ?? specifier,
        specifier,
        fixes: [],
      });
    } else if (!isGitIgnored(filePath)) {
      // Let's start out conservatively
      if (!isDeferResolveEntry(input) && !isConfig(input)) {
        addIssue({
          type: 'unresolved',
          filePath: containingFilePath,
          workspace: workspace.name,
          symbol: specifier,
          fixes: [],
        });
      } else {
        debugLog(workspace.name, `Unable to resolve ${toDebugString(input, options.cwd)}`);
      }
    }
  };
