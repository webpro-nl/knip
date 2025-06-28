import type { Entries } from 'type-fest';
import type { ReporterOptions } from '../types/issues.js';
import { printConfigurationHints } from './util/configuration-hints.js';
import { getColoredTitle, getIssueTypeTitle, getTableForType } from './util/util.js';

export default (options: ReporterOptions) => {
  const { report, issues, isDisableConfigHints, isShowProgress } = options;
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (let [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === 'files') reportType = '_files';

    if (isReportType) {
      const title = reportMultipleGroups && getIssueTypeTitle(reportType);

      const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);
      if (issuesForType.length > 0) {
        title && console.log(getColoredTitle(title, issuesForType.length));
        console.log(getTableForType(issuesForType).toString());
        totalIssues = totalIssues + issuesForType.length;
      }
    }
  }

  if (!isDisableConfigHints) {
    printConfigurationHints(options);
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
