import core from '@actions/core';
import { ISSUE_TYPES, ISSUE_TYPE_TITLE } from 'src/constants.js';
import type { ReporterOptions } from '../types/issues.js';

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
