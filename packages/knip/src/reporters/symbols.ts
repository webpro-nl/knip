import type { Entries } from '../types/entries.ts';
import type { InternalReporterOptions } from '../types/issues.ts';
import { printConfigurationHints, printTagHints } from './util/configuration-hints.ts';
import { dim, flattenIssues, getColoredTitle, getIssueTypeTitle, getTableForType } from './util/util.ts';

export default (options: InternalReporterOptions) => {
  const { report, issues, isDisableConfigHints, isDisableTagHints, isShowProgress } = options;
  const lines: string[] = [];
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = getIssueTypeTitle(reportType);

      const issuesForType = flattenIssues(issues[reportType]);
      if (issuesForType.length > 0) {
        title && lines.push(getColoredTitle(title, issuesForType.length));
        const issues =
          typeof options.maxShowIssues === 'number'
            ? Array.from(issuesForType).slice(0, options.maxShowIssues)
            : issuesForType;
        if (issues.length > 0) lines.push(getTableForType(issues, options.cwd).toString());
        if (issues.length !== issuesForType.length)
          lines.push(dim(`…${issuesForType.length - issues.length} more items`));
        totalIssues = totalIssues + issuesForType.length;
      }
    }
  }

  options.write(lines.join('\n'));

  if (!isDisableConfigHints) {
    printConfigurationHints(options);
  }

  if (!isDisableTagHints) {
    printTagHints(options);
  }

  if (
    totalIssues === 0 &&
    isShowProgress &&
    (!options.isTreatConfigHintsAsErrors || options.configurationHints.length === 0) &&
    (!options.isTreatTagHintsAsErrors || options.tagHints.size === 0)
  ) {
    options.write('✂️  Excellent, Knip found no issues.');
  }
};
