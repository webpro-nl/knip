import path from 'node:path';
import type { Issue, Issues, Configuration } from '../types';

const logIssueLine = ({ issue, cwd, padding }: { issue: Issue; cwd: string; padding: number }) => {
  console.log(
    `${issue.symbol.padEnd(padding + 2)}${issue.symbolType?.padEnd(11) || ''}${path.relative(cwd, issue.filePath)}`
  );
};

const logIssueGroupResult = (issues: string[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort();
    sortedByFilePath.forEach(filePath => console.log(path.relative(cwd, filePath)));
  } else {
    console.log('N/A');
  }
};

const logIssueGroupResults = (issues: Issue[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    const padding = [...issues].sort((a, b) => b.symbol.length - a.symbol.length)[0].symbol.length;
    sortedByFilePath.forEach(issue => logIssueLine({ issue, cwd, padding }));
  } else {
    console.log('N/A');
  }
};

export default ({ issues, config, cwd }: { issues: Issues; config: Configuration; cwd: string }) => {
  const {
    isOnlyFiles,
    isOnlyExports,
    isOnlyTypes,
    isOnlyNsMembers,
    isOnlyDuplicates,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindNsImports,
    isFindDuplicateExports,
  } = config;

  if (isFindUnusedFiles) {
    const unusedFiles = Array.from(issues.file);
    logIssueGroupResult(unusedFiles, cwd, !isOnlyFiles && 'UNUSED FILES');
  }

  if (isFindUnusedExports) {
    const unusedExports = Object.values(issues.export)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedExports, cwd, !isOnlyExports && 'UNUSED EXPORTS');
  }

  if (isFindUnusedTypes) {
    const unusedTypes = Object.values(issues.type)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedTypes, cwd, !isOnlyTypes && 'UNUSED TYPES');
  }

  if (isFindNsImports) {
    const unusedExports = Object.values(issues.member)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedExports, cwd, !isOnlyNsMembers && 'UNUSED NAMESPACE MEMBERS');
  }

  if (isFindDuplicateExports) {
    const unusedDuplicates = Object.values(issues.duplicate)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedDuplicates, cwd, !isOnlyDuplicates && 'DUPLICATE EXPORTS');
  }
};
