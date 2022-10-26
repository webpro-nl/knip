import EasyTable from 'easy-table';
import { relative } from '../util/path.js';
import { ISSUE_TYPE_TITLE } from './constants.js';
import type { Entries } from 'type-fest';
import type { Issue, ReporterOptions, IssueSet } from '../types.js';

const TRUNCATE_WIDTH = 40;
const truncate = (text: string) => (text.length > TRUNCATE_WIDTH ? text.slice(0, TRUNCATE_WIDTH - 3) + '...' : text);

const logIssueSet = (issues: string[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues.sort().forEach(value => console.log(value.startsWith('/') ? relative(value) : value));
  } else {
    console.log('Not found');
  }
};

const logIssueRecord = (issues: Issue[], title: false | string, isTruncate = false) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const table = new EasyTable();
    issues.forEach(issue => {
      table.cell('symbol', issue.symbols ? truncate(issue.symbols.join(', ')) : issue.symbol);
      issue.parentSymbol && table.cell('parentSymbol', issue.parentSymbol);
      issue.symbolType && table.cell('symbolType', issue.symbolType);
      table.cell('filePath', relative(issue.filePath));
      table.newRow();
    });
    console.log(table.sort(['filePath', 'parentSymbol', 'symbol']).print().trim());
  } else {
    console.log('Not found');
  }
};

export default ({ report, issues }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups && ISSUE_TYPE_TITLE[reportType];
      if (issues[reportType] instanceof Set) {
        logIssueSet(Array.from(issues[reportType] as IssueSet), title);
      } else {
        const issuesForType = Object.values(issues[reportType]).map(Object.values).flat();
        const isTruncate = Boolean(issuesForType[0]?.symbols?.length);
        logIssueRecord(issuesForType, title, isTruncate);
      }
    }
  }
};
