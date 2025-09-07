import { ISSUE_TYPE_TITLE } from '../constants.js';
import type { Entries } from '../types/entries.js';
import type { Issue, IssueRecords, ReporterOptions } from '../types/issues.js';
import { relative } from '../util/path.js';

const createGitHubActionsLogger = () => {
  const formatAnnotation = (
    level: 'error' | 'warning',
    message: string,
    options: {
      file: string;
      startLine?: number;
      endLine?: number;
      startColumn?: number;
      endColumn?: number;
    }
  ) => {
    const params = [`file=${options.file}`];
    if (options.startLine != null) params.push(`line=${options.startLine}`);
    if (options.endLine != null) params.push(`endLine=${options.endLine}`);
    if (options.startColumn != null) params.push(`col=${options.startColumn}`);
    if (options.endColumn != null) params.push(`endColumn=${options.endColumn}`);

    const paramString = params.join(',');
    console.log(`::${level} ${paramString}::${message}`);
  };

  return {
    info: (message: string) => console.log(message),
    error: (message: string, options: { file: string; startLine?: number; endLine?: number; startColumn?: number; endColumn?: number }) => formatAnnotation('error', message, options),
    warning: (message: string, options: { file: string; startLine?: number; endLine?: number; startColumn?: number; endColumn?: number }) => formatAnnotation('warning', message, options),
  };
};

function flatten(issues: IssueRecords): Issue[] {
  return Object.values(issues).flatMap(Object.values);
}

export default ({ report, issues, cwd }: ReporterOptions) => {
  const core = createGitHubActionsLogger();
  
  for (let [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (!isReportType) continue;

    if (reportType === 'files') reportType = '_files';

    const issue = issues[reportType];
    if (!issue) continue;

    const issueList: (string | Issue)[] = issue instanceof Set ? Array.from(issue) : flatten(issue);

    for (const issueItem of issueList) {
      if (typeof issueItem === 'string') {
        core.info(relative(cwd, issueItem));
        continue;
      }
      if (issueItem.isFixed || issueItem.severity === 'off') {
        continue;
      }

      const log = issueItem.severity === 'error' ? core.error : core.warning;
      const message = `${ISSUE_TYPE_TITLE[issueItem.type]}: ${issueItem.symbol}`;

      log(message, {
        file: relative(cwd, issueItem.filePath),
        startLine: issueItem.line ?? 0,
        endLine: issueItem.line ?? 0,
        startColumn: issueItem.col ?? 0,
        endColumn: issueItem.col ?? 0,
      });
    }
  }
};
