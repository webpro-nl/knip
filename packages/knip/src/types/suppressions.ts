import type { IssueType } from './issues.ts';

export interface SuppressionMeta {
  until?: string;
}

type SuppressionEntry = Record<string, SuppressionMeta>;

export type SuppressionsByType = Partial<Record<IssueType, SuppressionEntry>>;

export interface Suppressions {
  version: 1;
  suppressions: Record<string, SuppressionsByType>;
}

/** Whether this run analyzed the given file for the given issue type, i.e. whether its issues are known */
export type SuppressionScope = (filePath: string, issueType: IssueType) => boolean;

export interface ApplyResult {
  suppressedCount: number;
  expiredCount: number;
}
