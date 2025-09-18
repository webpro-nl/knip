import type { Entries } from '../types/entries.js';
import type { Issue, IssueRecords, IssueSet, ReporterOptions } from '../types/issues.js';
import { toRelative } from '../util/path.js';
import { getColoredTitle, getIssueLine, getIssueTypeTitle } from './util/util.js';

const logIssueSet = (issues: string[], cwd: string) => {
  for (const filePath of issues.sort()) console.log(toRelative(filePath, cwd));
};

const logIssueRecord = (issues: Issue[], cwd: string) => {
  const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
  for (const issue of sortedByFilePath) console.log(getIssueLine(issue, cwd));
};

export default ({ report, issues, isShowProgress, cwd }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups && getIssueTypeTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : reportType === 'duplicates'
          ? Object.values(issues[reportType]).flatMap(Object.values)
          : Object.values(issues[reportType] as IssueRecords).map(issues => {
              const items = Object.values(issues);
              return { ...items[0], symbols: items };
            });

      if (issuesForType.length > 0) {
        title && console.log(getColoredTitle(title, issuesForType.length));
        if (isSet) {
          logIssueSet(Array.from(issues[reportType] as IssueSet), cwd);
        } else {
          logIssueRecord(issuesForType, cwd);
        }
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
