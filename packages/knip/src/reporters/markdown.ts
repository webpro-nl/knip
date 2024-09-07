import type { Entries } from 'type-fest';
import type { Issue, IssueSet, ReporterOptions } from '../types/issues.js';
import { relative, toRelative } from '../util/path.js';
import { getTitle } from './util.js';

export default ({ report, issues }: ReporterOptions) => {
  console.log('# Knip report\n');

  const getFilePath = (issue: Issue) => {
    if (!(issue.line && issue.col)) return relative(issue.filePath);
    return `${relative(issue.filePath)}:${issue.line}:${issue.col}`;
  };
  const sortLongestSymbol = (a: Issue, b: Issue) => b.symbol.length - a.symbol.length;
  const sortLongestFilePath = (a: Issue, b: Issue) => getFilePath(b).length - getFilePath(a).length;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.values(issues[reportType]).flatMap(Object.values);

      if (issuesForType.length > 0) {
        console.log(`## ${title} (${issuesForType.length})\n`);
        if (isSet) {
          for (const issue of issuesForType.sort()) {
            console.log(`* ${toRelative(issue)}`);
          }
        } else {
          const longestSymbol = issuesForType.sort(sortLongestSymbol)[0].symbol.length;
          const sortedByFilePath = issuesForType.sort(sortLongestFilePath);
          const longestFilePath = getFilePath(sortedByFilePath[0]).length;

          console.log(`| ${'Name'.padEnd(longestSymbol)} | ${'Location'.padEnd(longestFilePath)} | Severity |`);
          console.log(`| :${'-'.repeat(longestSymbol - 1)} | :${'-'.repeat(longestFilePath - 1)} | :------- |`);
          for (const issue of sortedByFilePath) {
            console.log(
              `| ${issue.symbol.padEnd(longestSymbol)} | ${getFilePath(issue).padEnd(longestFilePath)} | ${(issue.severity ?? '').padEnd(8)} |`
            );
          }
        }
        console.log('');
      }
    }
  }
};
