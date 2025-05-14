import type { Entries } from 'type-fest';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import type { ReporterOptions } from '../types/issues.js';
import { toRelative } from '../util/path.js';
import { dim, getColoredTitle, getDimmedTitle, getIssueTypeTitle, getTableForType, plain } from './util.js';

export default ({
  report,
  issues,
  tagHints,
  configurationHints,
  isDisableConfigHints,
  isTreatConfigHintsAsErrors,
  isShowProgress,
}: ReporterOptions) => {
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
    if (configurationHints.size > 0) {
      const getTitle = isTreatConfigHintsAsErrors ? getColoredTitle : getDimmedTitle;
      console.log(getTitle('Configuration hints', configurationHints.size));
      const style = isTreatConfigHintsAsErrors ? plain : dim;
      for (const hint of configurationHints) {
        const { type, workspaceName, identifier } = hint;
        const message = `Unused item in ${type}`;
        const workspace =
          workspaceName && workspaceName !== ROOT_WORKSPACE_NAME ? ` (workspace: ${workspaceName})` : '';
        console.warn(style(`${message}${workspace}:`), identifier);
      }
    }
    if (tagHints.size > 0) {
      console.log(getColoredTitle('Tag issues', tagHints.size));
      for (const hint of tagHints) {
        const { filePath, identifier, tagName } = hint;
        const message = `Unused tag in ${toRelative(filePath)}:`;
        console.warn(dim(message), `${identifier} → ${tagName}`);
      }
    }
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
