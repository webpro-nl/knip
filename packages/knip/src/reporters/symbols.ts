import EasyTable from 'easy-table';
import picocolors from 'picocolors';
import type { Entries } from 'type-fest';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import type { Issue, ReporterOptions } from '../types/issues.js';
import { relative, toRelative } from '../util/path.js';
import { getTitle, identity, logTitle } from './util.js';

const TRUNCATE_WIDTH = 40;
const truncate = (text: string) => (text.length > TRUNCATE_WIDTH ? `${text.slice(0, TRUNCATE_WIDTH - 3)}...` : text);

const logIssueRecord = (issues: Issue[]) => {
  const table = new EasyTable();
  for (const issue of issues) {
    const print = issue.isFixed || issue.severity === 'warn' ? picocolors.gray : identity;
    table.cell('symbol', print(issue.symbols ? truncate(issue.symbols.map(s => s.symbol).join(', ')) : issue.symbol));
    issue.parentSymbol && table.cell('parentSymbol', print(issue.parentSymbol));
    issue.symbolType && table.cell('symbolType', print(issue.symbolType));
    const pos = issue.line === undefined ? '' : `:${issue.line}${issue.col === undefined ? '' : `:${issue.col}`}`;
    const cell = `${relative(issue.filePath)}${pos}`;
    table.cell('filePath', print(cell));
    issue.isFixed && table.cell('fixed', print('(fixed)'));
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

      if (reportType === '_files') {
        const issuesForType = Array.from(issues[reportType]);
        if (issuesForType.length > 0) {
          title && logTitle(title, issuesForType.length);
          for (const issue of issuesForType) {
            const relPath = toRelative(issue.filePath);
            if (issue.isFixed) console.log(picocolors.gray(`${relPath} (deleted)`));
            else console.log(relPath);
          }
          totalIssues = totalIssues + issuesForType.length;
        }
      } else {
        const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);
        if (issuesForType.length > 0) {
          title && logTitle(title, issuesForType.length);
          logIssueRecord(issuesForType);
          totalIssues = totalIssues + issuesForType.length;
        }
      }
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
