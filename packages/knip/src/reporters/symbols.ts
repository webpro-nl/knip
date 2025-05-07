import picocolors from 'picocolors';
import type { Entries } from 'type-fest';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import { type Issue, type ReporterOptions, SymbolType } from '../types/issues.js';
import { relative, toRelative } from '../util/path.js';
import { Table } from '../util/table.js';
import { getTitle, identity, logTitle, logTitleDimmed } from './util.js';

const dim = picocolors.gray;
const bright = picocolors.whiteBright;

const sortByPos = (a: any, b: any) => {
  const [f, r, c] = a.filePath.value.split(':');
  const [f2, r2, c2] = b.filePath.value.split(':');
  return f === f2 ? (Number(r) === Number(r2) ? Number(c) - Number(c2) : Number(r) - Number(r2)) : f.localeCompare(f2);
};

const highlightPkg =
  (issue: Issue) =>
  (_: unknown): string => {
    if (issue.specifier && issue.specifier !== issue.symbol && issue.specifier.includes(issue.symbol)) {
      const parts = issue.specifier.split(issue.symbol);
      const left = parts[0];
      const right = parts.slice(1).join('');
      return [dim(left), bright(issue.symbol), dim(right)].join('');
    }
    return issue.symbol;
  };

const logIssueRecord = (issues: Issue[]) => {
  const table = new Table({ truncateStart: ['filePath'], noTruncate: ['symbolType'] });
  for (const issue of issues) {
    table.newRow();
    const print = issue.isFixed || issue.severity === 'warn' ? dim : identity;
    const symbols = issue.symbols;
    table.cell('symbol', print(symbols ? symbols.map(s => s.symbol).join(', ') : issue.symbol), highlightPkg(issue));
    table.cell('parentSymbol', issue.parentSymbol && print(issue.parentSymbol));
    table.cell('symbolType', issue.symbolType && issue.symbolType !== SymbolType.UNKNOWN && print(issue.symbolType));
    const pos = issue.line === undefined ? '' : `:${issue.line}${issue.col === undefined ? '' : `:${issue.col}`}`;
    // @ts-expect-error TODO Fix up in next major
    const cell = issue.type === 'files' ? '' : `${relative(issue.filePath)}${pos}`;
    table.cell('filePath', print(cell));
    table.cell('fixed', issue.isFixed && print('(removed)'));
  }
  console.log(table.sort(sortByPos).toString());
};

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
      const title = reportMultipleGroups && getTitle(reportType);

      const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);
      if (issuesForType.length > 0) {
        title && logTitle(title, issuesForType.length);
        logIssueRecord(issuesForType);
        totalIssues = totalIssues + issuesForType.length;
      }
      // }
    }
  }

  if (!isDisableConfigHints) {
    if (configurationHints.size > 0) {
      const _logTitle = isTreatConfigHintsAsErrors ? logTitle : logTitleDimmed;
      const _color = isTreatConfigHintsAsErrors ? identity : dim;
      _logTitle('Configuration hints', configurationHints.size);
      for (const hint of configurationHints) {
        const { type, workspaceName, identifier } = hint;
        const message = `Unused item in ${type}`;
        const workspace =
          workspaceName && workspaceName !== ROOT_WORKSPACE_NAME ? ` (workspace: ${workspaceName})` : '';
        console.warn(_color(`${message}${workspace}:`), identifier);
      }
    }
    if (tagHints.size > 0) {
      logTitle('Tag issues', tagHints.size);
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
