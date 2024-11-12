import EasyTable from 'easy-table';
import type { Entries } from 'type-fest';
import type { Issue, ReporterOptions } from '../types/issues.js';
import { relative, toRelative } from '../util/path.js';
import { getTitle } from './util.js';

const printHeader = (size: number, title?: string) =>
  console.log(`<details>\n${title ? `<summary>${title} (${size})</summary>\n` : ''}\n\`\`\``);

const printFooter = () => console.log('```\n\n</details>\n');

const logIssueRecord = (issues: Issue[]) => {
  const table = new EasyTable();
  for (const issue of issues) {
    table.cell('symbol', issue.symbols ? issue.symbols.map(s => s.symbol).join(', ') : issue.symbol);
    issue.parentSymbol && table.cell('parentSymbol', issue.parentSymbol);
    issue.symbolType && table.cell('symbolType', issue.symbolType);
    const pos = issue.line === undefined ? '' : `:${issue.line}${issue.col === undefined ? '' : `:${issue.col}`}`;
    const cell = `${relative(issue.filePath)}${pos}`;
    table.cell('filePath', cell);
    table.newRow();
  }
  console.log(table.sort(['filePath', 'parentSymbol', 'symbol']).print().trim());
};

export default ({ report, issues }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === '_files') continue;

    if (isReportType) {
      const title = reportMultipleGroups ? getTitle(reportType) : undefined;

      if (reportType === 'files') {
        const issuesForType = Array.from(issues._files);
        if (issuesForType.length > 0) {
          printHeader(issuesForType.length, title);
          const sortedIssues = issuesForType.sort((a, b) => a.filePath.localeCompare(b.filePath));
          for (const issue of sortedIssues) console.log(toRelative(issue.filePath));
          totalIssues = totalIssues + issuesForType.length;
          printFooter();
        }
      } else {
        const issuesForType = Object.values(issues[reportType]).flatMap(Object.values);
        if (issuesForType.length > 0) {
          printHeader(issuesForType.length, title);
          logIssueRecord(issuesForType);
          totalIssues = totalIssues + issuesForType.length;
          printFooter();
        }
      }
    }
  }
};
