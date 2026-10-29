import type { Entries } from '../types/entries.ts';
import type { InternalReporterOptions, Issue } from '../types/issues.ts';
import { relative } from '../util/path.ts';
import { flattenIssues, getIssueTypeTitle } from './util/util.ts';

export default ({ report, issues, cwd, write }: InternalReporterOptions) => {
  const lines: string[] = ['# Knip report\n'];

  const getFilePath = (issue: Issue) => {
    if (!(issue.line && issue.col)) return relative(cwd, issue.filePath);
    return `${relative(cwd, issue.filePath)}:${issue.line}:${issue.col}`;
  };
  const sortLongestSymbol = (a: Issue, b: Issue) => b.symbol.length - a.symbol.length;
  const sortLongestFilePath = (a: Issue, b: Issue) => getFilePath(b).length - getFilePath(a).length;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = getIssueTypeTitle(reportType);
      const issuesForType = flattenIssues(issues[reportType]);

      if (issuesForType.length > 0) {
        lines.push(`## ${title} (${issuesForType.length})\n`);
        const longestSymbol = issuesForType.sort(sortLongestSymbol)[0].symbol.length;
        const sortedByFilePath = issuesForType.sort(sortLongestFilePath);
        const longestFilePath = getFilePath(sortedByFilePath[0]).length;
        const nameWidth = Math.max(longestSymbol, 'Name'.length);
        const locationWidth = Math.max(longestFilePath, 'Location'.length);

        lines.push(`| ${'Name'.padEnd(nameWidth)} | ${'Location'.padEnd(locationWidth)} | Severity |`);
        lines.push(`| :${'-'.repeat(nameWidth - 1)} | :${'-'.repeat(locationWidth - 1)} | :------- |`);
        for (const issue of sortedByFilePath) {
          lines.push(
            `| ${issue.symbol.padEnd(nameWidth)} | ${getFilePath(issue).padEnd(locationWidth)} | ${(issue.severity ?? '').padEnd(8)} |`
          );
        }
        lines.push('');
      }
    }
  }

  write(lines.join('\n'));
};
