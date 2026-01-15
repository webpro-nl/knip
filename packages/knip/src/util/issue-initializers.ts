import { ISSUE_TYPES } from '../constants.js';
import type { Counters, Issue, Issues, IssueType, Rules } from '../types/issues.js';

export const initIssues = (): Issues => ({
  ...(Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, {}])) as Record<IssueType, never>),
  files: new Set<string>(),
  _files: {} as Record<string, Record<string, Issue>>,
});

export const initCounters = (): Counters => ({
  ...(Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, 0])) as Record<IssueType, number>),
  processed: 0,
  total: 0,
});

export const defaultRules = Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, 'error'])) as Rules;
