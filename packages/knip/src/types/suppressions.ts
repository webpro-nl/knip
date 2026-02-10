import type { IssueType } from './issues.js';

export interface SuppressionMeta {
  until?: string;
}

export type SuppressionEntry = Record<string, SuppressionMeta>;

export type SuppressionsByType = Partial<Record<IssueType, SuppressionEntry>>;

export interface Suppressions {
  version: 1;
  suppressions: Record<string, SuppressionsByType>;
}

export interface ApplyResult {
  suppressedCount: number;
  expiredCount: number;
}
