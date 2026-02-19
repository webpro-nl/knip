import type { Entries } from '../types/entries.ts';
import type { ReporterOptions } from '../types/issues.ts';
import { getIssueTypeTitle, getTableForType } from './util/util.ts';

export default ({ report, issues, cwd }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;

  for (let [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === 'files') reportType = '_files';

    if (isReportType) {
      const title = reportMultipleGroups ? getIssueTypeTitle(reportType) : undefined;
      const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);
      if (issuesForType.length > 0) {
        console.log(`<details>\n${title ? `<summary>${title} (${issuesForType.length})</summary>\n` : ''}\n\`\`\``);
        console.log(getTableForType(issuesForType, cwd, { isUseColors: false }).toString());
        console.log('```\n\n</details>\n');
      }
    }
  }
};
