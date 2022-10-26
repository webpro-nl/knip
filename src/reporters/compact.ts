import { relative } from '../util/path.js';
import { ISSUE_TYPE_TITLE } from './constants.js';
import type { Entries } from 'type-fest';
import type { Issue, ReporterOptions, IssueSet, IssueRecords } from '../types.js';

const logIssueLine = (filePath: string, symbols?: string[], parentSymbol?: string) => {
  const symbol = symbols ? `: ${symbols.join(', ')}` : '';
  const parent = parentSymbol ? ` (${parentSymbol})` : '';
  console.log(`${relative(filePath)}${symbol}${parent}`);
};

const logIssueSet = (issues: string[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues.sort().forEach(value => console.log(value.startsWith('/') ? relative(value) : value));
  } else {
    console.log('Not found');
  }
};

const logIssueRecord = (issues: Issue[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    sortedByFilePath.forEach(({ filePath, symbols, parentSymbol }) => logIssueLine(filePath, symbols, parentSymbol));
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
      } else if (reportType === 'duplicates') {
        const issuesForType = Object.values(issues[reportType]).map(Object.values).flat();
        logIssueRecord(issuesForType, title);
      } else {
        const issuesForType = Object.values(issues[reportType] as IssueRecords).map(issues => {
          const items = Object.values(issues);
          return { ...items[0], symbols: items.map(issue => issue.symbol) };
        });
        logIssueRecord(issuesForType, title);
      }
    }
  }
};
