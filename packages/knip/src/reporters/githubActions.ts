import { ISSUE_TYPES, ISSUE_TYPE_TITLE } from 'src/constants.js';
import type { ReporterOptions } from '../types/issues.js';

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
    if (options.startLine) params.push(`line=${options.startLine}`);
    if (options.endLine) params.push(`endLine=${options.endLine}`);
    if (options.startColumn) params.push(`col=${options.startColumn}`);
    if (options.endColumn) params.push(`endColumn=${options.endColumn}`);

    const paramString = params.join(',');
    console.log(`::${level} ${paramString}::${message}`);
  };

  return {
    info: (message: string) => console.log(message),
    error: (message: string, options: { file: string; startLine?: number; endLine?: number; startColumn?: number; endColumn?: number }) => formatAnnotation('error', message, options),
    warning: (message: string, options: { file: string; startLine?: number; endLine?: number; startColumn?: number; endColumn?: number }) => formatAnnotation('warning', message, options),
  };
};

const core = createGitHubActionsLogger();

export default ({ issues }: ReporterOptions) => {
  for (const issueName of ISSUE_TYPES) {
    const issue = issues[issueName];

    const issueSet =
      issue instanceof Set ? Array.from(issue) : Object.values(issue).flatMap(record => Object.values(record));

    for (const issueItem of issueSet) {
      if (typeof issueItem === 'string') {
        core.info(issueItem);
        continue;
      }
      if (issueItem.isFixed || issueItem.severity === 'off') {
        continue;
      }

      const log = issueItem.severity === 'error' ? core.error : core.warning;

      log(ISSUE_TYPE_TITLE[issueItem.type], {
        file: issueItem.filePath,
        startLine: issueItem.line,
        endLine: issueItem.line,
        endColumn: issueItem.col,
        startColumn: issueItem.col,
      });
    }
  }
};
