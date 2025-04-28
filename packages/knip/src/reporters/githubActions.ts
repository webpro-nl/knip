import core from '@actions/core';
import type { ReporterOptions } from '../types/issues.js';

export const ISSUE_TYPES = [
  // must be _files
  '_files',
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'nsExports',
  'types',
  'nsTypes',
  'enumMembers',
  'classMembers',
  'duplicates',
] as const;

const ISSUE_TYPE_TITLE = {
  files: 'Unused files',
  _files: 'Unused files',
  dependencies: 'Unused dependencies',
  devDependencies: 'Unused devDependencies',
  optionalPeerDependencies: 'Referenced optional peerDependencies',
  unlisted: 'Unlisted dependencies',
  binaries: 'Unlisted binaries',
  unresolved: 'Unresolved imports',
  exports: 'Unused exports',
  nsExports: 'Exports in used namespace',
  types: 'Unused exported types',
  nsTypes: 'Exported types in used namespace',
  enumMembers: 'Unused exported enum members',
  classMembers: 'Unused exported class members',
  duplicates: 'Duplicate exports',
};

export default (options: ReporterOptions) => {
  for (const issueName of ISSUE_TYPES) {
    const issue = options.issues[issueName];

    for (const file of Object.keys(issue)) {
      const issueSet = issue[file];

      for (const issueKey of Object.keys(issueSet)) {
        const issueItem = issueSet[issueKey];

        if (issueItem.isFixed || issueItem.severity === 'off') {
          continue;
        }

        const log = issueItem.severity === 'error' ? core.error : core.warning;

        log(ISSUE_TYPE_TITLE[issueItem.type], {
          file: file,
          startLine: issueItem.line,
          endLine: issueItem.line,
          endColumn: issueItem.col,
          startColumn: issueItem.col,
        });
      }
    }
  }
};
