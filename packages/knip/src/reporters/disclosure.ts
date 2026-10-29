import type { Entries } from '../types/entries.ts';
import type { InternalReporterOptions } from '../types/issues.ts';
import { flattenIssues, getIssueTypeTitle, getTableForType } from './util/util.ts';

export default ({ report, issues, cwd, write }: InternalReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  const lines: string[] = [];

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups ? getIssueTypeTitle(reportType) : undefined;
      const issuesForType = flattenIssues(issues[reportType]);
      if (issuesForType.length > 0) {
        lines.push(`<details>\n${title ? `<summary>${title} (${issuesForType.length})</summary>\n` : ''}\n\`\`\``);
        lines.push(getTableForType(issuesForType, cwd, { isUseColors: false }).toString());
        lines.push('```\n\n</details>\n');
      }
    }
  }

  write(lines.join('\n'));
};
