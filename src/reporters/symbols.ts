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
  const { include } = config;
  const reportMultipleGroups = Object.values(include).filter(Boolean).length > 1;

  if (include.files) {
    const unusedFiles = Array.from(issues.files);
    logIssueGroupResult(unusedFiles, cwd, reportMultipleGroups && 'UNUSED FILES');
  }

  if (include.exports) {
    const unusedExports = Object.values(issues.exports).map(Object.values).flat();
    logIssueGroupResults(unusedExports, cwd, reportMultipleGroups && 'UNUSED EXPORTS');
  }

  if (include.types) {
    const unusedTypes = Object.values(issues.types)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedTypes, cwd, reportMultipleGroups && 'UNUSED TYPES');
  }

  if (include.members) {
    const unusedExports = Object.values(issues.members)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedExports, cwd, reportMultipleGroups && 'UNUSED NAMESPACE MEMBERS');
  }

  if (include.duplicates) {
    const unusedDuplicates = Object.values(issues.duplicates)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedDuplicates, cwd, reportMultipleGroups && 'DUPLICATE EXPORTS');
  }
};
