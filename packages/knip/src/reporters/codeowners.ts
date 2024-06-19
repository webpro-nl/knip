import { OwnershipEngine } from '@snyk/github-codeowners/dist/lib/ownership/index.js';
import picocolors from 'picocolors';
import type { Entries } from 'type-fest';
import type { Issue, IssueRecords, IssueSet, ReporterOptions } from '../types/issues.js';
import { relative, resolve, toRelative } from '../util/path.js';
import { getTitle, logIssueLine, logTitle } from './util.js';

type OwnedIssue = Issue & { owner: string };

type ExtraReporterOptions = {
  path?: string;
};

const logIssueSet = (issues: { symbol: string; owner: string }[]) => {
  for (const issue of issues.sort((a, b) => (a.owner < b.owner ? -1 : 1))) {
    console.log(picocolors.cyan(issue.owner), toRelative(issue.symbol));
  }
};

const logIssueRecord = (issues: OwnedIssue[]) => {
  const sortedByFilePath = issues.sort((a, b) => (a.owner < b.owner ? -1 : 1));
  for (const { filePath, symbols, owner, parentSymbol } of sortedByFilePath) {
    logIssueLine({ owner, filePath, symbols, parentSymbol });
  }
};

export default ({ report, issues, isShowProgress, options }: ReporterOptions) => {
  let opts: ExtraReporterOptions = {};
  try {
    opts = options ? JSON.parse(options) : opts;
  } catch (error) {
    console.error(error);
  }
  const codeownersFilePath = resolve(opts.path ?? '.github/CODEOWNERS');
  const codeownersEngine = OwnershipEngine.FromCodeownersFile(codeownersFilePath);
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  const [dependenciesOwner = '[no-owner]'] = codeownersEngine.calcFileOwnership('package.json');
  const fallbackOwner = dependenciesOwner;
  let totalIssues = 0;

  const calcFileOwnership = (filePath: string) =>
    codeownersEngine.calcFileOwnership(relative(filePath))[0] ?? fallbackOwner;
  const addOwner = (issue: Issue) => ({ ...issue, owner: calcFileOwnership(issue.filePath) });

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups && getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const toIssue = (filePath: string) => ({ type: reportType, filePath, symbol: filePath }) as Issue;

      const issuesForType =
        issues[reportType] instanceof Set
          ? Array.from(issues[reportType] as IssueSet)
              .map(toIssue)
              .map(addOwner)
          : reportType === 'duplicates'
            ? Object.values(issues[reportType]).flatMap(Object.values).map(addOwner)
            : Object.values(issues[reportType] as IssueRecords).map(issues => {
                const symbols = Object.values(issues);
                return addOwner({ ...symbols[0], symbols });
              });

      if (issuesForType.length > 0) {
        if (totalIssues) console.log();
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

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
