import { ISSUE_TYPES } from '../constants.js';
import { Issues, Counters, Report, IssueType } from '../types/issues.js';

export const initIssues = (): Issues => ({
  ...(Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, {}])) as Record<IssueType, never>),
  files: new Set(),
});

export const initCounters = (): Counters => ({
  ...(Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, 0])) as Record<IssueType, number>),
  processed: 0,
  total: 0,
});

export const initReport = (): Report =>
  Object.fromEntries(ISSUE_TYPES.map(issueType => [issueType, true])) as Record<IssueType, boolean>;
