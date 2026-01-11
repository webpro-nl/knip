import { execSync } from 'node:child_process';
import picomatch from 'picomatch';
import type { WorkspacePackage } from '../types/package-json.js';
import { ConfigurationError } from './errors.js';
import { isDirectory, isFile } from './fs.js';
import { join } from './path.js';

export type WorkspaceSelectorType = 'pkg-name' | 'dir-path' | 'dir-glob' | 'git-range';

export interface ParsedSelector {
  type: WorkspaceSelectorType;
  pattern: string;
  isNegated: boolean;
}

/**
 * Parse a workspace selector token and determine its type.
 */
export function parseWorkspaceSelector(token: string, cwd: string): ParsedSelector {
  const trimmed = token.trim();
  let isNegated = false;
  let pattern = trimmed;

  if (trimmed.startsWith('!')) {
    isNegated = true;
    pattern = trimmed.slice(1);
  }

  // Git range selector [ref] or [ref...ref] or [ref..ref]
  if (pattern.startsWith('[') && pattern.endsWith(']')) {
    const range = pattern.slice(1, -1);
    return {
      type: 'git-range',
      pattern: range,
      isNegated,
    };
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
  if (isDirectory(dirPath) && isFile(join(dirPath, 'package.json'))) {
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
 */
export function matchWorkspacesByDirGlob(pattern: string, availableWorkspaceNames: string[]): string[] {
  const matcher = picomatch(pattern);
  return availableWorkspaceNames.filter(name => matcher(name));
}

/**
 * Get changed files from Git and map to workspaces.
 */
export function selectWorkspacesByGit(range: string, cwd: string, availableWorkspaceNames: string[]): string[] {
  try {
    const gitRange = range.includes('...') || range.includes('..') ? range : `${range}...HEAD`;

    const command = `git diff --name-only ${gitRange}`;
    const output = execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

    const changedFiles = output
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const workspaceSet = new Set<string>();

    // Sort by depth (deepest first) to correctly map files to nested workspaces
    const sortedNames = [...availableWorkspaceNames].sort((a, b) => {
      const depthA = a.split('/').length;
      const depthB = b.split('/').length;
      return depthB - depthA;
    });

    for (const file of changedFiles) {
      for (const name of sortedNames) {
        if (name === '.' || name === '' || file.startsWith(`${name}/`) || file === name) {
          workspaceSet.add(name);
          break;
        }
      }
    }

    return Array.from(workspaceSet);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigurationError(
      `Failed to get Git changes for range "${range}": ${message}. Ensure you're in a Git repository and the ref exists.`
    );
  }
}

/**
 * Select workspaces based on multiple selectors.
 */
export function selectWorkspaces(
  selectors: string[] | undefined,
  cwd: string,
  workspacePackages: Map<string, WorkspacePackage>,
  availableWorkspaceNames: string[]
): string[] | undefined {
  if (!selectors || selectors.length === 0) {
    return undefined;
  }

  const parsedSelectors = selectors.map(s => parseWorkspaceSelector(s, cwd));

  const pkgNameToWorkspaceName = new Map<string, string>();
  for (const [workspaceName, pkg] of workspacePackages.entries()) {
    if (pkg.pkgName) pkgNameToWorkspaceName.set(pkg.pkgName, workspaceName);
  }
  const pkgNames = Array.from(pkgNameToWorkspaceName.keys());

  const positiveSelectors = parsedSelectors.filter(s => !s.isNegated);
  const negativeSelectors = parsedSelectors.filter(s => s.isNegated);

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

      case 'git-range':
        matches = selectWorkspacesByGit(selector.pattern, cwd, availableWorkspaceNames);
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

  return Array.from(selectedWorkspaces);
}
