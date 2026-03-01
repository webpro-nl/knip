import type { Entries } from '../types/entries.ts';
import type { ReporterOptions } from '../types/issues.ts';
import { printConfigurationHints } from './util/configuration-hints.ts';
import { dim, getColoredTitle, getIssueTypeTitle, getTableForType } from './util/util.ts';

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
        const issues =
          typeof options.maxShowIssues === 'number'
            ? Array.from(issuesForType).slice(0, options.maxShowIssues)
            : issuesForType;
        if (issues.length > 0) console.log(getTableForType(issues, options.cwd).toString());
        if (issues.length !== issuesForType.length)
          console.log(dim(`…${issuesForType.length - issues.length} more items`));
        totalIssues = totalIssues + issuesForType.length;
      }
    }
  }

  if (!isDisableConfigHints) {
    printConfigurationHints(options);
  }

  if (
    totalIssues === 0 &&
    isShowProgress &&
    (!options.isTreatConfigHintsAsErrors || options.configurationHints.length === 0)
  ) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
