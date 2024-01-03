import { relative, toRelative } from '../util/path.js';
import { getTitle } from './util.js';
import type { Issue, IssueSet, ReporterOptions } from '../types/issues.js';
import type { Entries } from 'type-fest';

export default ({ report, issues }: ReporterOptions) => {
  console.log('# Knip report\n');

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.values(issues[reportType]).map(Object.values).flat();

      if (issuesForType.length > 0) {
        console.log(`## ${title} (${issuesForType.length})\n`);
        if (isSet) {
          issuesForType.sort().forEach((issue: string) => {
            console.log(`* ${toRelative(issue)}`);
          });
        } else {
          const longestSymbol = issuesForType.sort((a, b) => b.symbol.length - a.symbol.length)[0].symbol.length;
          const longestFilePath = relative(
            issuesForType.sort((a, b) => relative(b.filePath).length - relative(a.filePath).length)[0].filePath
          ).length;
          const sortedByFilePath = issuesForType.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
          console.log(`| ${`Name`.padEnd(longestSymbol)} | ${`Location`.padEnd(longestFilePath)} |`);
          console.log(`|:${'-'.repeat(longestSymbol + 1)}|:${'-'.repeat(longestFilePath + 1)}|`);
          sortedByFilePath.forEach((issue: Issue) => {
            console.log(
              `| ${issue.symbol.padEnd(longestSymbol)} | ${relative(issue.filePath).padEnd(longestFilePath)} |`
            );
          });
        }
        console.log('');
      }
    }
  }
};
