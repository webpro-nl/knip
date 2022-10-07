import path from 'node:path';
import type { Issue, Issues, Configuration } from '../types';

const logIssueLine = (cwd: string, filePath: string, symbols?: string[]) => {
  console.log(`${path.relative(cwd, filePath)}${symbols ? `: ${symbols.join(', ')}` : ''}`);
};

const logIssueGroupResult = (issues: string[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues.sort().forEach(filePath => logIssueLine(cwd, filePath));
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
    const unreferencedFiles = Array.from(issues.files);
    logIssueGroupResult(unreferencedFiles, cwd, reportMultipleGroups && 'UNREFERENCED FILES');
  }

  if (include.exports) {
    const unreferencedExports = Object.values(issues.exports).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedExports, cwd, reportMultipleGroups && 'UNREFERENCED EXPORTS');
  }

  if (include.types) {
    const unreferencedTypes = Object.values(issues.types).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedTypes, cwd, reportMultipleGroups && 'UNREFERENCED TYPES');
  }

  if (include.members) {
    const unreferencedMembers = Object.values(issues.members).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedMembers, cwd, reportMultipleGroups && 'UNREFERENCED NAMESPACE MEMBERS');
  }

  if (include.duplicates) {
    const unreferencedDuplicates = Object.values(issues.duplicates)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unreferencedDuplicates, cwd, reportMultipleGroups && 'DUPLICATE EXPORTS');
  }
};
