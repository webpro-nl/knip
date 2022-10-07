import path from 'node:path';
import type { Issue, Issues, Configuration } from '../types';

const logIssueLine = (cwd: string, filePath: string, symbols?: string[]) => {
  console.log(`${path.relative(cwd, filePath)}${symbols ? `: ${symbols.join(', ')}` : ''}`);
};

const logIssueGroupResult = (issues: string[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort();
    sortedByFilePath.forEach(filePath => logIssueLine(cwd, filePath));
  } else {
    console.log('N/A');
  }
};

const logIssueGroupResults = (issues: Issue[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    sortedByFilePath.forEach(({ filePath, symbols }) => logIssueLine(cwd, filePath, symbols));
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
    const unusedExports = Object.values(issues.exports).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unusedExports, cwd, reportMultipleGroups && 'UNUSED EXPORTS');
  }

  if (include.types) {
    const unusedTypes = Object.values(issues.types).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unusedTypes, cwd, reportMultipleGroups && 'UNUSED TYPES');
  }

  if (include.members) {
    const unusedMembers = Object.values(issues.members).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unusedMembers, cwd, reportMultipleGroups && 'UNUSED NAMESPACE MEMBERS');
  }

  if (include.duplicates) {
    const unusedDuplicates = Object.values(issues.duplicates)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unusedDuplicates, cwd, reportMultipleGroups && 'DUPLICATE EXPORTS');
  }
};
