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

export interface ApplyResult {
  suppressedCount: number;
  expiredCount: number;
}
