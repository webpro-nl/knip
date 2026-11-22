import picomatch from 'picomatch';
import { ROOT_WORKSPACE_NAME } from './constants.ts';
import type { ConfigurationHint, UnusedIgnorePatternReason } from './types/issues.ts';
import { join, relative } from './util/path.ts';

export type UnusedIgnorePattern = {
  hints: ConfigurationHint[];
  isMatch: (path: string) => boolean;
};

interface ReasonContext {
  cwd: string;
  filePaths: Iterable<string>[];
  isGitIgnored: (filePath: string) => boolean;
}

interface SettleContext {
  countWorkspaces: (configKey: string) => number;
}

const isWorkspaceSpecificHint = (hint: ConfigurationHint) =>
  hint.type === 'project-extension-unregistered' || hint.type === 'project-extension-excluded';

export const getUnusedIgnorePatternHints = (patterns: UnusedIgnorePattern[], context: ReasonContext) => {
  const hints: ConfigurationHint[] = [];
  if (patterns.length === 0) return hints;

  const reasons = new Map<UnusedIgnorePattern, UnusedIgnorePatternReason>();
  const pending = new Set(patterns);
  for (const paths of context.filePaths) {
    for (const filePath of paths) {
      if (pending.size === 0) break;
      const relativePath = relative(context.cwd, filePath);
      for (const pattern of pending) {
        if (pattern.isMatch(relativePath)) {
          reasons.set(pattern, 'no-issues');
          pending.delete(pattern);
        }
      }
    }
  }

  for (const pattern of patterns) {
    for (const hint of pattern.hints) {
      let reason = reasons.get(pattern);
      if (!reason) {
        const base = picomatch.scan(String(hint.identifier)).base;
        const isIgnored = base && context.isGitIgnored(join(context.cwd, hint.workspaceName ?? '', base));
        reason = isIgnored ? 'gitignored' : 'no-matches';
      }
      hints.push({ ...hint, reason });
    }
  }

  return hints;
};

export const settleConfigurationHints = (candidates: Iterable<ConfigurationHint>, context: SettleContext) => {
  const groups = new Map<string, { hint: ConfigurationHint; workspaces: Set<string> }>();
  for (const hint of candidates) {
    const key = `${hint.configKey ?? hint.workspaceName}::${hint.type}::${hint.identifier}`;
    const group = groups.get(key);
    if (group) {
      if (hint.workspaceName) group.workspaces.add(hint.workspaceName);
    } else {
      groups.set(key, { hint, workspaces: new Set(hint.workspaceName ? [hint.workspaceName] : []) });
    }
  }

  const coverage = new Map<string, number>();
  const hints: ConfigurationHint[] = [];
  for (const { hint, workspaces } of groups.values()) {
    const { configKey } = hint;
    if (configKey && configKey !== ROOT_WORKSPACE_NAME && !isWorkspaceSpecificHint(hint)) {
      let count = coverage.get(configKey);
      if (count === undefined) coverage.set(configKey, (count = context.countWorkspaces(configKey)));
      if (workspaces.size < count) continue;
    }
    hints.push(hint);
  }

  return hints;
};
