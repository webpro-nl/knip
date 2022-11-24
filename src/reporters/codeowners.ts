import path from 'node:path';
import { OwnershipEngine } from '@snyk/github-codeowners/dist/lib/ownership/index.js';
import { relative } from '../util/path.js';
import { ISSUE_TYPE_TITLE } from './constants.js';
import type { Issue, ReporterOptions, IssueSet, IssueRecords } from '../types/issues.js';
import type { Entries } from 'type-fest';

type OwnedIssue = Issue & { owner: string };

type ExtraReporterOptions = {
  path?: string;
};

const logIssueLine = (owner: string, filePath: string, symbols?: string[], parentSymbol?: string) => {
  const symbol = symbols ? `: ${symbols.join(', ')}` : '';
  const parent = parentSymbol ? ` (${parentSymbol})` : '';
  console.log(`${owner} ${relative(filePath)}${symbol}${parent}`);
};

const logIssueSet = (issues: { symbol: string; owner: string }[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues
      .sort((a, b) => (a.owner < b.owner ? -1 : 1))
      .forEach(issue => console.log(issue.owner, issue.symbol.startsWith('/') ? relative(issue.symbol) : issue.symbol));
  } else {
    console.log('Not found');
  }
};

const logIssueRecord = (issues: OwnedIssue[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.owner < b.owner ? -1 : 1));
    sortedByFilePath.forEach(({ filePath, symbols, owner, parentSymbol }) =>
      logIssueLine(owner, filePath, symbols, parentSymbol)
    );
  } else {
    console.log('Not found');
  }
};

export default ({ report, issues, options }: ReporterOptions) => {
  let opts: ExtraReporterOptions = {};
  try {
    opts = options ? JSON.parse(options) : opts;
  } catch (error) {
    console.error(error);
  }
  const codeownersFilePath = path.resolve(opts.path ?? '.github/CODEOWNERS');
  const codeownersEngine = OwnershipEngine.FromCodeownersFile(codeownersFilePath);
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  const [dependenciesOwner = '[no-owner]'] = codeownersEngine.calcFileOwnership('package.json');
  const fallbackOwner = dependenciesOwner;

  const calcFileOwnership = (filePath: string) =>
    codeownersEngine.calcFileOwnership(relative(filePath))[0] ?? fallbackOwner;
  const addOwner = (issue: Issue) => ({ ...issue, owner: calcFileOwnership(issue.filePath) });

  for (const [type, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups && ISSUE_TYPE_TITLE[type];
      if (issues[type] instanceof Set) {
        const toIssue = (filePath: string) => ({ type, filePath, symbol: filePath } as Issue);
        const issuesForType = Array.from(issues[type] as IssueSet).map(toIssue);
        logIssueSet(issuesForType.map(addOwner), title);
      } else if (type === 'duplicates') {
        const issuesForType = Object.values(issues[type]).map(Object.values).flat().map(addOwner);
        logIssueRecord(issuesForType, title);
      } else {
        const issuesForType = Object.values(issues[type] as IssueRecords).map(issues => {
          const items = Object.values(issues);
          return addOwner({ ...items[0], symbols: items.map(issue => issue.symbol) });
        });
        logIssueRecord(issuesForType, title);
      }
    }
  }
};
