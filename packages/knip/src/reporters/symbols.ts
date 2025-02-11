import EasyTable from 'easy-table';
import picocolors from 'picocolors';
import type { Entries } from 'type-fest';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import type { Issue, ReporterOptions } from '../types/issues.js';
import { relative, toRelative } from '../util/path.js';
import { truncate } from '../util/string.js';
import { getTitle, identity, logTitle, logTitleDimmed } from './util.js';

const dim = picocolors.gray;
const bright = picocolors.whiteBright;

const TRUNCATE_WIDTH = 40;
const truncateStart = (text: string, width: number) => (text.length > width ? `...${text.slice(-(width - 3))}` : text);

const sortByPos = (a: Issue, b: Issue) => {
  const [f, r, c] = a.filePath.split(':');
  const [f2, r2, c2] = b.filePath.split(':');
  return f === f2 ? (Number(r) === Number(r2) ? Number(c) - Number(c2) : Number(r) - Number(r2)) : f.localeCompare(f2);
};

const hl = (issue: Issue) => {
  if (issue.specifier && issue.specifier !== issue.symbol && issue.specifier.includes(issue.symbol)) {
    const parts = issue.specifier.split(issue.symbol);
    const right = parts.slice(1).join('');
    const max = TRUNCATE_WIDTH - issue.symbol.length - right.length;
    const part = parts[0];
    const left = part.length > 3 ? (max <= 3 ? `...${part.slice(-3)}` : truncateStart(part, max)) : part;
    return [dim(left), bright(issue.symbol), dim(right)].join('');
  }
  return issue.symbol;
};

const logIssueRecord = (issues: Issue[]) => {
  const table = new EasyTable();
  for (const issue of issues) {
    const print = issue.isFixed || issue.severity === 'warn' ? dim : identity;
    const symbols = issue.symbols;
    table.cell('symbol', print(symbols ? truncate(symbols.map(s => s.symbol).join(', '), TRUNCATE_WIDTH) : hl(issue)));
    issue.parentSymbol && table.cell('parentSymbol', print(issue.parentSymbol));
    issue.symbolType && table.cell('symbolType', print(issue.symbolType));
    const pos = issue.line === undefined ? '' : `:${issue.line}${issue.col === undefined ? '' : `:${issue.col}`}`;
    const cell = `${relative(issue.filePath)}${pos}`;
    table.cell('filePath', print(cell));
    issue.isFixed && table.cell('fixed', print('(removed)'));
    table.newRow();
  }
  console.log(table.sort(sortByPos).print().trim());
};

export default ({ report, issues, tagHints, configurationHints, noConfigHints, isShowProgress }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === '_files') continue;

    if (isReportType) {
      const title = reportMultipleGroups && getTitle(reportType);

      if (reportType === 'files') {
        const issuesForType = Array.from(issues._files);
        if (issuesForType.length > 0) {
          title && logTitle(title, issuesForType.length);
          const sortedIssues = issuesForType.sort((a, b) => a.filePath.localeCompare(b.filePath));
          for (const issue of sortedIssues) {
            const relPath = toRelative(issue.filePath);
            if (issue.isFixed) console.log(dim(`${relPath} (removed)`));
            else if (issue.severity === 'warn') console.log(dim(relPath));
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

  if (!noConfigHints) {
    if (configurationHints.size > 0) {
      logTitleDimmed('Configuration hints');
      for (const hint of configurationHints) {
        const { type, workspaceName, identifier } = hint;
        const message = `Unused item in ${type}`;
        const workspace =
          workspaceName && workspaceName !== ROOT_WORKSPACE_NAME ? ` (workspace: ${workspaceName})` : '';
        console.warn(dim(`${message}${workspace}:`), identifier);
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
