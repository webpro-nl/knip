import path from 'node:path';
import type { Issue, Issues, Configuration } from '../types';

const logIssueLine = (cwd: string, filePath: string, symbol: string, padding: number) => {
  console.log(`${symbol.padEnd(padding + 2)}${path.relative(cwd, filePath)}`);
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
    sortedByFilePath.forEach(({ filePath, symbol }) => logIssueLine(cwd, filePath, symbol, padding));
  } else {
    console.log('N/A');
  }
};

export default ({ issues, config, cwd }: { issues: Issues; config: Configuration; cwd: string }) => {
  const {
    isOnlyFiles,
    isOnlyExports,
    isOnlyTypes,
    isOnlyDuplicates,
    isFindUnusedFiles,
    isFindUnusedExports,
    isFindUnusedTypes,
    isFindDuplicateExports
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

  if (isFindDuplicateExports) {
    const unusedDuplicates = Object.values(issues.duplicate)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedDuplicates, cwd, !isOnlyDuplicates && 'DUPLICATE EXPORTS');
  }
};
