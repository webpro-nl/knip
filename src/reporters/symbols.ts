import { relative } from '../util/path';
import { ISSUE_TYPE_TITLE } from './constants';
import type { Entries } from 'type-fest';
import type { Issue, ReporterOptions, IssueSet } from '../types';

const TRUNCATE_WIDTH = 40;

const logIssueLine = (issue: Issue, maxWidth: number) => {
  const symbols = issue.symbols ? issue.symbols.join(', ') : issue.symbol;
  const truncatedSymbol = symbols.length > maxWidth ? symbols.slice(0, maxWidth - 3) + '...' : symbols;
  const filePath = relative(issue.filePath);
  console.log(`${truncatedSymbol.padEnd(maxWidth + 2)}${issue.symbolType?.padEnd(11) || ''}${filePath}`);
};

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
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    const maxWidth = isTruncate ? TRUNCATE_WIDTH : issues.reduce((max, issue) => Math.max(issue.symbol.length, max), 0);
    sortedByFilePath.forEach(issue => logIssueLine(issue, maxWidth));
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
