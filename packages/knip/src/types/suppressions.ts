import type { WorkspaceFilePathFilter } from '../util/workspace-file-filter.ts';
import type { Issues, IssueType } from './issues.ts';

/** Knip preserves these fields but gives them no meaning; use a preprocessor to act on your own */
export type SuppressionMeta = Record<string, unknown>;

type SuppressionEntry = Record<string, SuppressionMeta>;

export type SuppressionsByType = Partial<Record<IssueType, SuppressionEntry>>;

export interface Suppressions {
  version: 1;
  suppressions: Record<string, SuppressionsByType>;
}

/** Whether this run analyzed the given file for the given issue type, i.e. whether its issues are known */
export type SuppressionScope = (filePath: string, issueType: IssueType) => boolean;

/** What a single run covered: which files it took into account, and which of those it reports on */
export interface AnalysisScope {
  workspaceFilePathFilter: WorkspaceFilePathFilter;
  isConsidered: (filePath: string) => boolean;
}

export interface ApplyResult {
  suppressedCount: number;
  suppressedIssues: Issues;
}
