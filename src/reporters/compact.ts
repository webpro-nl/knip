import path from 'node:path';
import type { Issues, Configuration } from '../types';

const logIssueLine = (cwd: string, filePath: string, symbols: string[]) => {
  console.log(`${path.relative(cwd, filePath)}: ${symbols.join(', ')}`);
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

const logIssueGroupResults = (
  issues: { filePath: string; symbols: string[] }[],
  cwd: string,
  title: false | string
) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    sortedByFilePath.forEach(({ filePath, symbols }) => logIssueLine(cwd, filePath, symbols));
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
    const unusedExports = Object.values(issues.export).map(issues => {
      const items = Object.values(issues);
      return {
        filePath: items[0].filePath,
        symbols: items.map(i => i.symbol)
      };
    });
    logIssueGroupResults(unusedExports, cwd, !isOnlyExports && 'UNUSED EXPORTS');
  }

  if (isFindUnusedTypes) {
    const unusedTypes = Object.values(issues.type).map(issues => {
      const items = Object.values(issues);
      return {
        filePath: items[0].filePath,
        symbols: items.map(i => i.symbol)
      };
    });
    logIssueGroupResults(unusedTypes, cwd, !isOnlyTypes && 'UNUSED TYPES');
  }

  if (isFindDuplicateExports) {
    const unusedDuplicates = Object.values(issues.duplicate).map(issues => {
      const items = Object.values(issues);
      return {
        filePath: items[0].filePath,
        symbols: items.map(i => i.symbols ?? []).flat()
      };
    });
    logIssueGroupResults(unusedDuplicates, cwd, !isOnlyDuplicates && 'DUPLICATE EXPORTS');
  }
};
