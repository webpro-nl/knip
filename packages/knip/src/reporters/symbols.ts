import EasyTable from 'easy-table';
import picocolors from 'picocolors';
import type { Entries } from 'type-fest';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import type { Issue, IssueSet, ReporterOptions } from '../types/issues.js';
import { relative } from '../util/path.js';
import { getTitle, identity, logIssueSet, logTitle } from './util.js';

const TRUNCATE_WIDTH = 40;
const truncate = (text: string) => (text.length > TRUNCATE_WIDTH ? `${text.slice(0, TRUNCATE_WIDTH - 3)}...` : text);

const logIssueRecord = (issues: Issue[]) => {
  const table = new EasyTable();
  for (const issue of issues) {
    const print = issue.severity === 'warn' ? picocolors.gray : identity;
    table.cell('symbol', print(issue.symbols ? truncate(issue.symbols.map(s => s.symbol).join(', ')) : issue.symbol));
    issue.parentSymbol && table.cell('parentSymbol', print(issue.parentSymbol));
    issue.symbolType && table.cell('symbolType', print(issue.symbolType));
    const filePath = `${relative(issue.filePath)}${
      issue.line === undefined ? '' : `:${issue.line}${issue.col === undefined ? '' : `:${issue.col}`}`
    }`;
    table.cell('filePath', print(filePath));
    table.newRow();
  }
  console.log(table.sort(['filePath', 'parentSymbol', 'symbol']).print().trim());
};

export default ({ report, issues, configurationHints, noConfigHints, isShowProgress }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === 'files') continue;

    if (isReportType) {
      const title = reportMultipleGroups && getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.values(issues[reportType]).flatMap(Object.values);

      if (issuesForType.length > 0) {
        title && logTitle(title, issuesForType.length);
        if (isSet) {
          logIssueSet(issuesForType);
        } else {
          logIssueRecord(issuesForType);
        }
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  if (!noConfigHints && configurationHints.size > 0) {
    logTitle('Configuration issues', configurationHints.size);
    for (const hint of configurationHints) {
      const { type, workspaceName, identifier } = hint;
      const message = `Unused item in ${type}`;
      const workspace = workspaceName && workspaceName !== ROOT_WORKSPACE_NAME ? ` (workspace: ${workspaceName})` : '';
      console.warn(picocolors.gray(`${message}${workspace}:`), identifier);
    }
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
