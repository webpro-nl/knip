import type { Entries } from 'type-fest';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import type { ConfigurationHintType, ReporterOptions } from '../types/issues.js';
import { toRelative } from '../util/path.js';
import { bright, dim, getColoredTitle, getDimmedTitle, getIssueTypeTitle, getTableForType, plain } from './util.js';

const unusedItem = (type: string) => `Unused item in ${bright(type)}`;
const redundantItem = (type: string) => `Redundant item in ${bright(type.split('-').at(0))}`;
const unusedTopLevel = (type: string) => `Unused item in top-level ${bright(type.split('-').at(0))}`;
const revisitItem = (type: string) => `Revisit ${bright(type.split('-').at(0))}`;

const solutions = new Map<ConfigurationHintType, { description: (type: string) => string; hint: string }>([
  ['ignoreBinaries', { description: unusedItem, hint: 'can be removed' }],
  ['ignoreDependencies', { description: unusedItem, hint: 'can be removed' }],
  ['ignoreUnresolved', { description: unusedItem, hint: 'can be removed' }],
  ['ignoreWorkspaces', { description: unusedItem, hint: 'can be removed' }],
  ['entry', { description: unusedItem, hint: 'remove, or move to workspace config' }],
  ['project', { description: unusedItem, hint: 'remove, or move to workspace config' }],
  ['entry-redundant', { description: redundantItem, hint: 'remove' }],
  ['project-redundant', { description: redundantItem, hint: 'remove' }],
  ['entry-top-level', { description: unusedTopLevel, hint: 'move to workspaces["."]' }],
  ['project-top-level', { description: unusedTopLevel, hint: 'move to workspaces["."]' }],
  ['entry-empty', { description: revisitItem, hint: 'no files found' }],
  ['project-empty', { description: revisitItem, hint: 'no files found' }],
]);

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
        const workspace =
          workspaceName && workspaceName !== ROOT_WORKSPACE_NAME ? ` (workspace: ${workspaceName})` : '';
        const solution = solutions.get(type);
        if (solution) {
          const { description, hint } = solution;
          console.warn(style(`${description(type)}${workspace}:`), identifier, style(` (hint: ${hint})`));
        }
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
