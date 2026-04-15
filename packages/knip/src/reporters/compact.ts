import type { Entries } from '../types/entries.ts';
import type { Issue, ReporterOptions } from '../types/issues.ts';
import { flattenIssues, getColoredTitle, getIssueLine, getIssueTypeTitle } from './util/util.ts';

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
      const issuesForType =
        reportType === 'duplicates'
          ? flattenIssues(issues[reportType])
          : Object.values(issues[reportType])
              .filter(issues => Object.keys(issues).length > 0)
              .map(issues => {
                const items = Object.values(issues);
                return { ...items[0], symbols: items };
              });

      if (issuesForType.length > 0) {
        title && console.log(getColoredTitle(title, issuesForType.length));
        logIssueRecord(issuesForType, cwd);
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
