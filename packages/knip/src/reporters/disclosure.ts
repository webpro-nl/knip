import type { Entries } from '../types/entries.js';
import type { ReporterOptions } from '../types/issues.js';
import { getIssueTypeTitle, getTableForType } from './util/util.js';

export default ({ report, issues }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;

  for (let [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === 'files') reportType = '_files';

    if (isReportType) {
      const title = reportMultipleGroups ? getIssueTypeTitle(reportType) : undefined;
      const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);
      if (issuesForType.length > 0) {
        console.log(`<details>\n${title ? `<summary>${title} (${issuesForType.length})</summary>\n` : ''}\n\`\`\``);
        console.log(getTableForType(issuesForType, { isUseColors: false }).toString());
        console.log('```\n\n</details>\n');
      }
    }
  }
};
