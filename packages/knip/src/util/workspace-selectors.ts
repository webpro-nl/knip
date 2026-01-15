import picomatch from 'picomatch';
import type { WorkspacePackage } from '../types/package-json.js';
import { partition } from './array.js';
import { ConfigurationError } from './errors.js';
import { isDirectory, isFile } from './fs.js';
import { join } from './path.js';

type WorkspaceSelectorType = 'pkg-name' | 'dir-path' | 'dir-glob';

export interface ParsedSelector {
  type: WorkspaceSelectorType;
  pattern: string;
  isNegated: boolean;
}

/**
 * Parse a workspace selector token and determine its type.
 * @internal
 */
export function parseWorkspaceSelector(token: string, cwd: string): ParsedSelector {
  const trimmed = token.trim();
  let isNegated = false;
  let pattern = trimmed;

  if (trimmed.startsWith('!')) {
    isNegated = true;
    pattern = trimmed.slice(1);
  }

  if (pattern.startsWith('./')) {
    return {
      type: 'dir-glob',
      pattern: pattern.slice(2),
      isNegated,
    };
  }

  const hasGlobChars = /[*?[\]{}]/.test(pattern);
  if (pattern.includes('/') && !pattern.startsWith('@') && !hasGlobChars) {
    return {
      type: 'dir-path',
      pattern: pattern,
      isNegated,
    };
  }

  // Existing directory with package.json (backward compatibility)
  const dirPath = join(cwd, pattern);
  if (isDirectory(dirPath) && isFile(dirPath, 'package.json')) {
    return {
      type: 'dir-path',
      pattern: pattern,
      isNegated,
    };
  }

  return {
    type: 'pkg-name',
    pattern: pattern,
    isNegated,
  };
}

/**
 * Match workspaces by package name pattern.
 * @internal
 */
export function matchWorkspacesByPkgName(
  pattern: string,
  pkgNames: string[],
  pkgNameToWorkspaceName: Map<string, string>
): string[] {
  const matcher = picomatch(pattern);
  const matched = pkgNames.filter(name => matcher(name));

  return matched
    .map(pkgName => pkgNameToWorkspaceName.get(pkgName))
    .filter((name): name is string => name !== undefined);
}

/**
 * Match workspaces by directory glob pattern.
 * @internal
 */
export function matchWorkspacesByDirGlob(pattern: string, availableWorkspaceNames: string[]): string[] {
  const matcher = picomatch(pattern);
  return availableWorkspaceNames.filter(name => matcher(name));
}

/**
 * Select workspaces based on multiple selectors.
 */
export function selectWorkspaces(
  selectors: string[] | undefined,
  cwd: string,
  workspacePackages: Map<string, WorkspacePackage>,
  availableWorkspaceNames: string[]
): Set<string> | undefined {
  if (!selectors || selectors.length === 0) {
    return undefined;
  }

  const parsedSelectors = selectors.map(s => parseWorkspaceSelector(s, cwd));

  const pkgNameToWorkspaceName = new Map<string, string>();
  for (const [workspaceName, pkg] of workspacePackages.entries()) {
    if (pkg.pkgName) pkgNameToWorkspaceName.set(pkg.pkgName, workspaceName);
  }
  const pkgNames = Array.from(pkgNameToWorkspaceName.keys());

  const [positiveSelectors, negativeSelectors] = partition(parsedSelectors, s => !s.isNegated);

  const selectedWorkspaces = new Set<string>(positiveSelectors.length === 0 ? availableWorkspaceNames : []);

  const applySelector = (selector: ParsedSelector) => {
    let matches: string[] = [];

    switch (selector.type) {
      case 'pkg-name':
        matches = matchWorkspacesByPkgName(selector.pattern, pkgNames, pkgNameToWorkspaceName);
        if (matches.length === 0 && !selector.isNegated && !/[*?[\]{}]/.test(selector.pattern)) {
          throw new ConfigurationError(`Workspace package name "${selector.pattern}" did not match any workspaces.`);
        }
        break;

      case 'dir-path':
        if (availableWorkspaceNames.includes(selector.pattern)) {
          matches = [selector.pattern];
        } else if (!selector.isNegated) {
          throw new ConfigurationError(`Workspace directory "${selector.pattern}" not found.`);
        }
        break;

      case 'dir-glob':
        matches = matchWorkspacesByDirGlob(selector.pattern, availableWorkspaceNames);
        if (matches.length === 0 && !selector.isNegated) {
          throw new ConfigurationError(
            `Workspace directory pattern "${selector.pattern}" did not match any workspaces.`
          );
        }
        break;
    }
    return matches;
  };

  for (const selector of positiveSelectors) {
    for (const match of applySelector(selector)) {
      selectedWorkspaces.add(match);
    }
  }

  for (const selector of negativeSelectors) {
    for (const match of applySelector(selector)) {
      selectedWorkspaces.delete(match);
    }
  }

  return selectedWorkspaces;
}
